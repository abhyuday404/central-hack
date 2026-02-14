// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MedicalRecord {
    // Define what a "Record" looks like
    struct Record {
        string ipfsHash; // The "fingerprint" of the file stored on Pinata
        string fileName; // Readable name (e.g., "X-Ray Chest")
        address doctor; // Who uploaded it
        uint256 timestamp; // When it was uploaded
    }

    enum RequestStatus {
        Pending,
        Approved,
        Rejected
    }

    struct AccessRequest {
        address requester;
        uint256 timestamp;
        RequestStatus status;
        uint256 durationInHours; // How long access is requested for
        uint256 grantedAt; // When access was granted (0 if not yet)
        uint256 expiresAt; // When access expires (0 if not yet granted)
    }

    // Map a Patient's Wallet Address -> List of their Records
    mapping(address => Record[]) private patientRecords;

    // Map a Patient -> Requests
    mapping(address => AccessRequest[]) private accessRequests;

    // Map a Patient -> Requester -> Access expiry timestamp (0 = no access)
    mapping(address => mapping(address => uint256)) private accessExpiry;

    // Events help your frontend know when something happened
    event RecordAdded(
        address indexed patient,
        string ipfsHash,
        address indexed doctor
    );
    event AccessRequested(
        address indexed patient,
        address indexed requester,
        uint256 requestId,
        uint256 durationInHours
    );
    event AccessRequestResolved(
        address indexed patient,
        address indexed requester,
        uint256 requestId,
        bool approved,
        uint256 expiresAt
    );
    event AccessRevoked(address indexed patient, address indexed requester);
    event AccessExtended(
        address indexed patient,
        address indexed requester,
        uint256 newExpiresAt
    );

    // Check if a requester currently has valid (non-expired) access to a patient's records
    function hasAccess(
        address _patient,
        address _requester
    ) public view returns (bool) {
        // Patient always has access to their own records
        if (_requester == _patient) return true;
        // Check if access is granted and not expired
        uint256 expiry = accessExpiry[_patient][_requester];
        return expiry > 0 && block.timestamp <= expiry;
    }

    // Get the expiry timestamp for a requester's access to a patient's records
    function getAccessExpiry(
        address _patient,
        address _requester
    ) public view returns (uint256) {
        if (_requester == _patient) return type(uint256).max; // Patient always has access
        return accessExpiry[_patient][_requester];
    }

    // Get remaining seconds of access (0 if expired or no access)
    function getRemainingAccess(
        address _patient,
        address _requester
    ) public view returns (uint256) {
        if (_requester == _patient) return type(uint256).max;
        uint256 expiry = accessExpiry[_patient][_requester];
        if (expiry == 0 || block.timestamp > expiry) return 0;
        return expiry - block.timestamp;
    }

    // Request access to a patient's records with a specified duration
    function requestAccess(
        address _patient,
        uint256 _durationInHours
    ) public returns (uint256 requestId) {
        require(_patient != address(0), "Invalid patient");
        require(_durationInHours > 0, "Duration must be > 0");
        require(
            _durationInHours <= 8760,
            "Max duration is 1 year (8760 hours)"
        );
        require(msg.sender != _patient, "Cannot request access to own records");

        AccessRequest memory request = AccessRequest({
            requester: msg.sender,
            timestamp: block.timestamp,
            status: RequestStatus.Pending,
            durationInHours: _durationInHours,
            grantedAt: 0,
            expiresAt: 0
        });

        accessRequests[_patient].push(request);
        requestId = accessRequests[_patient].length - 1;

        emit AccessRequested(_patient, msg.sender, requestId, _durationInHours);
    }

    // Patient reviews their access requests
    function getRequests(
        address _patient
    ) public view returns (AccessRequest[] memory) {
        require(msg.sender == _patient, "Only patient");
        return accessRequests[_patient];
    }

    // Patient approves or rejects an access request
    function respondToRequest(uint256 _requestId, bool _approve) public {
        require(
            _requestId < accessRequests[msg.sender].length,
            "Invalid request ID"
        );
        AccessRequest storage request = accessRequests[msg.sender][_requestId];
        require(request.requester != address(0), "Invalid request");
        require(request.status == RequestStatus.Pending, "Already resolved");

        uint256 expiresAt = 0;

        if (_approve) {
            request.status = RequestStatus.Approved;
            request.grantedAt = block.timestamp;
            expiresAt = block.timestamp + (request.durationInHours * 1 hours);
            request.expiresAt = expiresAt;
            accessExpiry[msg.sender][request.requester] = expiresAt;
        } else {
            request.status = RequestStatus.Rejected;
        }

        emit AccessRequestResolved(
            msg.sender,
            request.requester,
            _requestId,
            _approve,
            expiresAt
        );
    }

    // Patient can revoke access at any time, even before expiry
    function revokeAccess(address _requester) public {
        require(_requester != address(0), "Invalid requester");
        require(
            accessExpiry[msg.sender][_requester] > 0,
            "No access to revoke"
        );

        accessExpiry[msg.sender][_requester] = 0;

        emit AccessRevoked(msg.sender, _requester);
    }

    // Patient can extend an existing access grant
    function extendAccess(address _requester, uint256 _additionalHours) public {
        require(_requester != address(0), "Invalid requester");
        require(_additionalHours > 0, "Additional hours must be > 0");

        uint256 currentExpiry = accessExpiry[msg.sender][_requester];
        require(currentExpiry > 0, "No existing access to extend");

        uint256 baseTime = block.timestamp > currentExpiry
            ? block.timestamp
            : currentExpiry;
        uint256 newExpiry = baseTime + (_additionalHours * 1 hours);

        // Ensure extended access doesn't exceed 1 year from now
        require(
            newExpiry <= block.timestamp + (8760 * 1 hours),
            "Cannot extend beyond 1 year"
        );

        accessExpiry[msg.sender][_requester] = newExpiry;

        emit AccessExtended(msg.sender, _requester, newExpiry);
    }

    // Get all active (non-expired) accessors for a patient
    // Uses a two-pass approach: first collects unique addresses, then filters active ones
    function getActiveAccessors(
        address _patient
    ) public view returns (address[] memory, uint256[] memory) {
        require(msg.sender == _patient, "Only patient");

        AccessRequest[] storage requests = accessRequests[_patient];
        uint256 len = requests.length;

        if (len == 0) {
            return (new address[](0), new uint256[](0));
        }

        // Collect unique requesters with active access in one pass (reverse for latest-first dedup)
        address[] memory temp = new address[](len);
        uint256[] memory tempExp = new uint256[](len);
        uint256 count = 0;

        for (uint256 i = len; i > 0; i--) {
            address req = requests[i - 1].requester;
            uint256 expiry = accessExpiry[_patient][req];

            // Skip if no active access
            if (expiry == 0 || block.timestamp > expiry) continue;

            // Skip if we already recorded this requester (dedup)
            bool found = false;
            for (uint256 j = 0; j < count; j++) {
                if (temp[j] == req) {
                    found = true;
                    break;
                }
            }
            if (found) continue;

            temp[count] = req;
            tempExp[count] = expiry;
            count++;
        }

        // Copy into correctly-sized arrays
        address[] memory addrs = new address[](count);
        uint256[] memory expiries = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            addrs[i] = temp[i];
            expiries[i] = tempExp[i];
        }

        return (addrs, expiries);
    }

    // Upload a record (Only creates the link, doesn't store the file)
    function addRecord(
        address _patient,
        string memory _ipfsHash,
        string memory _fileName
    ) public {
        require(hasAccess(_patient, msg.sender), "Not authorized");

        Record memory newRecord = Record({
            ipfsHash: _ipfsHash,
            fileName: _fileName,
            doctor: msg.sender,
            timestamp: block.timestamp
        });

        patientRecords[_patient].push(newRecord);

        emit RecordAdded(_patient, _ipfsHash, msg.sender);
    }

    // View a patient's records (only if access is valid and not expired)
    function getRecords(
        address _patient
    ) public view returns (Record[] memory) {
        require(hasAccess(_patient, msg.sender), "Not authorized");
        return patientRecords[_patient];
    }
}
