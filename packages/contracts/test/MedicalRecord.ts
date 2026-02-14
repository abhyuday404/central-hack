import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("MedicalRecord", function () {
  it("records access requests and approvals", async function () {
    const [patient, doctor] = await ethers.getSigners();
    const medicalRecord = await ethers.deployContract("MedicalRecord");

    await expect(
      medicalRecord.connect(doctor).requestAccess(patient.address),
    )
      .to.emit(medicalRecord, "AccessRequested")
      .withArgs(patient.address, doctor.address, 0n);

    await expect(medicalRecord.connect(patient).respondToRequest(0, true))
      .to.emit(medicalRecord, "AccessRequestResolved")
      .withArgs(patient.address, doctor.address, 0n, true);

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

    await medicalRecord.connect(doctor).requestAccess(patient.address);
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
});
