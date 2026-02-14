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
    }

    // Map a Patient's Wallet Address -> List of their Records
    mapping(address => Record[]) private patientRecords;

    // Map a Patient -> Requests
    mapping(address => AccessRequest[]) private accessRequests;

    // Map a Patient -> Approved Requester
    mapping(address => mapping(address => bool)) private approvedAccess;

    // Events help your frontend know when something happened
    event RecordAdded(address indexed patient, string ipfsHash, address indexed doctor);
    event AccessRequested(
        address indexed patient,
        address indexed requester,
        uint256 requestId
    );
    event AccessRequestResolved(
        address indexed patient,
        address indexed requester,
        uint256 requestId,
        bool approved
    );

    function hasAccess(address _patient, address _requester) public view returns (bool) {
        return _requester == _patient || approvedAccess[_patient][_requester];
    }

    // Function 1: Request access to a patient's records
    function requestAccess(address _patient) public returns (uint256 requestId) {
        require(_patient != address(0), "Invalid patient");

        AccessRequest memory request = AccessRequest({
            requester: msg.sender,
            timestamp: block.timestamp,
            status: RequestStatus.Pending
        });

        accessRequests[_patient].push(request);
        requestId = accessRequests[_patient].length - 1;

        emit AccessRequested(_patient, msg.sender, requestId);
    }

    // Function 2: Patient reviews access requests
    function getRequests(address _patient)
        public
        view
        returns (AccessRequest[] memory)
    {
        require(msg.sender == _patient, "Only patient");
        return accessRequests[_patient];
    }

    // Function 3: Patient approves or rejects access
    function respondToRequest(uint256 _requestId, bool _approve) public {
        AccessRequest storage request = accessRequests[msg.sender][_requestId];
        require(request.requester != address(0), "Invalid request");
        require(request.status == RequestStatus.Pending, "Already resolved");

        request.status = _approve ? RequestStatus.Approved : RequestStatus.Rejected;
        if (_approve) {
            approvedAccess[msg.sender][request.requester] = true;
        }

        emit AccessRequestResolved(
            msg.sender,
            request.requester,
            _requestId,
            _approve
        );
    }

    // Function 4: Upload a record (Only creates the link, doesn't store the file)
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

    // Function 5: View a patient's records
    function getRecords(address _patient) public view returns (Record[] memory) {
        require(hasAccess(_patient, msg.sender), "Not authorized");
        return patientRecords[_patient];
    }
}
