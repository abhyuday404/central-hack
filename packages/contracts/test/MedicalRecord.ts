import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("MedicalRecord", function () {
  it("records access requests with duration and approvals", async function () {
    const [patient, doctor] = await ethers.getSigners();
    const medicalRecord = await ethers.deployContract("MedicalRecord");

    // Request access for 24 hours
    await expect(
      medicalRecord.connect(doctor).requestAccess(patient.address, 24),
    )
      .to.emit(medicalRecord, "AccessRequested")
      .withArgs(patient.address, doctor.address, 0n, 24n);

    await expect(
      medicalRecord.connect(patient).respondToRequest(0, true),
    ).to.emit(medicalRecord, "AccessRequestResolved");

    expect(
      await medicalRecord.hasAccess(patient.address, doctor.address),
    ).to.equal(true);
  });

  it("blocks unapproved access to records", async function () {
    const [patient, doctor] = await ethers.getSigners();
    const medicalRecord = await ethers.deployContract("MedicalRecord");

    await expect(
      medicalRecord.connect(doctor).getRecords(patient.address),
    ).to.be.revertedWith("Not authorized");
  });

  it("allows approved providers to add records", async function () {
    const [patient, doctor] = await ethers.getSigners();
    const medicalRecord = await ethers.deployContract("MedicalRecord");

    await medicalRecord.connect(doctor).requestAccess(patient.address, 24);
    await medicalRecord.connect(patient).respondToRequest(0, true);

    await expect(
      medicalRecord
        .connect(doctor)
        .addRecord(patient.address, "QmHash", "X-Ray Chest"),
    )
      .to.emit(medicalRecord, "RecordAdded")
      .withArgs(patient.address, "QmHash", doctor.address);

    const records = await medicalRecord
      .connect(patient)
      .getRecords(patient.address);
    expect(records.length).to.equal(1);
    expect(records[0].fileName).to.equal("X-Ray Chest");
  });

  it("rejects access request with zero duration", async function () {
    const [patient, doctor] = await ethers.getSigners();
    const medicalRecord = await ethers.deployContract("MedicalRecord");

    await expect(
      medicalRecord.connect(doctor).requestAccess(patient.address, 0),
    ).to.be.revertedWith("Duration must be > 0");
  });

  it("rejects access request exceeding 1 year", async function () {
    const [patient, doctor] = await ethers.getSigners();
    const medicalRecord = await ethers.deployContract("MedicalRecord");

    await expect(
      medicalRecord.connect(doctor).requestAccess(patient.address, 8761),
    ).to.be.revertedWith("Max duration is 1 year (8760 hours)");
  });

  it("prevents requesting access to own records", async function () {
    const [patient] = await ethers.getSigners();
    const medicalRecord = await ethers.deployContract("MedicalRecord");

    await expect(
      medicalRecord.connect(patient).requestAccess(patient.address, 24),
    ).to.be.revertedWith("Cannot request access to own records");
  });

  it("expires access after the granted duration", async function () {
    const [patient, doctor] = await ethers.getSigners();
    const medicalRecord = await ethers.deployContract("MedicalRecord");

    // Request 1 hour of access
    await medicalRecord.connect(doctor).requestAccess(patient.address, 1);
    await medicalRecord.connect(patient).respondToRequest(0, true);

    // Access should be valid now
    expect(
      await medicalRecord.hasAccess(patient.address, doctor.address),
    ).to.equal(true);

    // Fast-forward 2 hours (7200 seconds)
    await ethers.provider.send("evm_increaseTime", [7200]);
    await ethers.provider.send("evm_mine", []);

    // Access should be expired now
    expect(
      await medicalRecord.hasAccess(patient.address, doctor.address),
    ).to.equal(false);

    // Should not be able to read records anymore
    await expect(
      medicalRecord.connect(doctor).getRecords(patient.address),
    ).to.be.revertedWith("Not authorized");
  });

  it("allows patient to revoke access before expiry", async function () {
    const [patient, doctor] = await ethers.getSigners();
    const medicalRecord = await ethers.deployContract("MedicalRecord");

    await medicalRecord.connect(doctor).requestAccess(patient.address, 24);
    await medicalRecord.connect(patient).respondToRequest(0, true);

    // Access should be valid
    expect(
      await medicalRecord.hasAccess(patient.address, doctor.address),
    ).to.equal(true);

    // Revoke access
    await expect(medicalRecord.connect(patient).revokeAccess(doctor.address))
      .to.emit(medicalRecord, "AccessRevoked")
      .withArgs(patient.address, doctor.address);

    // Access should be revoked
    expect(
      await medicalRecord.hasAccess(patient.address, doctor.address),
    ).to.equal(false);
  });

  it("allows patient to extend existing access", async function () {
    const [patient, doctor] = await ethers.getSigners();
    const medicalRecord = await ethers.deployContract("MedicalRecord");

    // Grant 1 hour access
    await medicalRecord.connect(doctor).requestAccess(patient.address, 1);
    await medicalRecord.connect(patient).respondToRequest(0, true);

    // Extend by 24 more hours
    await expect(
      medicalRecord.connect(patient).extendAccess(doctor.address, 24),
    ).to.emit(medicalRecord, "AccessExtended");

    // Fast-forward 2 hours - should still have access because we extended
    await ethers.provider.send("evm_increaseTime", [7200]);
    await ethers.provider.send("evm_mine", []);

    expect(
      await medicalRecord.hasAccess(patient.address, doctor.address),
    ).to.equal(true);
  });

  it("returns remaining access time correctly", async function () {
    const [patient, doctor] = await ethers.getSigners();
    const medicalRecord = await ethers.deployContract("MedicalRecord");

    // No access yet
    expect(
      await medicalRecord.getRemainingAccess(patient.address, doctor.address),
    ).to.equal(0n);

    // Grant 1 hour access
    await medicalRecord.connect(doctor).requestAccess(patient.address, 1);
    await medicalRecord.connect(patient).respondToRequest(0, true);

    // Remaining should be roughly 3600 seconds (1 hour)
    const remaining = await medicalRecord.getRemainingAccess(
      patient.address,
      doctor.address,
    );
    expect(remaining).to.be.greaterThan(3500n);
    expect(remaining).to.be.lessThanOrEqual(3600n);
  });

  it("returns access expiry correctly", async function () {
    const [patient, doctor] = await ethers.getSigners();
    const medicalRecord = await ethers.deployContract("MedicalRecord");

    // No access - expiry should be 0
    expect(
      await medicalRecord.getAccessExpiry(patient.address, doctor.address),
    ).to.equal(0n);

    // Patient always has max access to own records
    const patientExpiry = await medicalRecord.getAccessExpiry(
      patient.address,
      patient.address,
    );
    expect(patientExpiry).to.be.greaterThan(0n);
  });

  it("rejects a request and denies access", async function () {
    const [patient, doctor] = await ethers.getSigners();
    const medicalRecord = await ethers.deployContract("MedicalRecord");

    await medicalRecord.connect(doctor).requestAccess(patient.address, 24);
    await medicalRecord.connect(patient).respondToRequest(0, false);

    expect(
      await medicalRecord.hasAccess(patient.address, doctor.address),
    ).to.equal(false);
  });

  it("prevents revoking access that does not exist", async function () {
    const [patient, doctor] = await ethers.getSigners();
    const medicalRecord = await ethers.deployContract("MedicalRecord");

    await expect(
      medicalRecord.connect(patient).revokeAccess(doctor.address),
    ).to.be.revertedWith("No access to revoke");
  });

  it("prevents extending access that does not exist", async function () {
    const [patient, doctor] = await ethers.getSigners();
    const medicalRecord = await ethers.deployContract("MedicalRecord");

    await expect(
      medicalRecord.connect(patient).extendAccess(doctor.address, 24),
    ).to.be.revertedWith("No existing access to extend");
  });

  it("stores duration and expiry in access request struct", async function () {
    const [patient, doctor] = await ethers.getSigners();
    const medicalRecord = await ethers.deployContract("MedicalRecord");

    await medicalRecord.connect(doctor).requestAccess(patient.address, 48);
    await medicalRecord.connect(patient).respondToRequest(0, true);

    const requests = await medicalRecord
      .connect(patient)
      .getRequests(patient.address);
    expect(requests.length).to.equal(1);
    expect(requests[0].durationInHours).to.equal(48n);
    expect(requests[0].grantedAt).to.be.greaterThan(0n);
    expect(requests[0].expiresAt).to.be.greaterThan(requests[0].grantedAt);
    expect(requests[0].status).to.equal(1n); // Approved
  });

  it("prevents responding to the same request twice", async function () {
    const [patient, doctor] = await ethers.getSigners();
    const medicalRecord = await ethers.deployContract("MedicalRecord");

    await medicalRecord.connect(doctor).requestAccess(patient.address, 24);
    await medicalRecord.connect(patient).respondToRequest(0, true);

    await expect(
      medicalRecord.connect(patient).respondToRequest(0, false),
    ).to.be.revertedWith("Already resolved");
  });

  it("patient always has access to own records", async function () {
    const [patient] = await ethers.getSigners();
    const medicalRecord = await ethers.deployContract("MedicalRecord");

    expect(
      await medicalRecord.hasAccess(patient.address, patient.address),
    ).to.equal(true);
  });
});
