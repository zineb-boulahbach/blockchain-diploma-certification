const DiplomaRegistry = artifacts.require("DiplomaRegistry");

contract("DiplomaRegistry", (accounts) => {
  const [owner, student, other] = accounts;
  const hash = web3.utils.keccak256("diploma-pdf-content");

  it("deploys with correct owner", async () => {
    const instance = await DiplomaRegistry.deployed();
    const onChainOwner = await instance.owner();
    assert.equal(onChainOwner, owner, "owner should be deployer");
  });

  it("adds a diploma and stores all fields", async () => {
    const instance = await DiplomaRegistry.new({ from: owner });

    await instance.addDiploma(
      hash,
      "CNE12345",
      student,
      "jsonCid:pdfCid",
      "Alice Doe",
      "Informatique",
      "2026",
      { from: owner }
    );

    const diploma = await instance.getDiploma(hash);
    assert.equal(diploma.studentId, "CNE12345");
    assert.equal(diploma.studentWallet, student);
    assert.equal(diploma.ipfsCID, "jsonCid:pdfCid");
    assert.equal(diploma.studentName, "Alice Doe");
    assert.equal(diploma.filiere, "Informatique");
    assert.equal(diploma.yearObtained, "2026");
    assert.equal(diploma.isRevoked, false);

    const exists = await instance.diplomaExists(hash);
    assert.equal(exists, true, "diploma should exist");
  });

  it("blocks non-owner from adding diploma", async () => {
    const instance = await DiplomaRegistry.new({ from: owner });
    let reverted = false;

    try {
      await instance.addDiploma(
        hash,
        "CNE99999",
        student,
        "jsonCid:pdfCid",
        "Bob Doe",
        "Math",
        "2025",
        { from: other }
      );
    } catch (error) {
      reverted = true;
      assert.include(
        error.message,
        "revert",
        "transaction should revert for non-owner"
      );
    }

    assert.equal(reverted, true, "expected addDiploma to revert");
  });

  it("revokes diploma and prevents double revoke", async () => {
    const instance = await DiplomaRegistry.new({ from: owner });
    const localHash = web3.utils.keccak256("second-diploma");

    await instance.addDiploma(
      localHash,
      "CNE77777",
      student,
      "metaCid:pdfCid",
      "Charlie",
      "Physique",
      "2024",
      { from: owner }
    );

    await instance.revokeDiploma(localHash, { from: owner });
    const revoked = await instance.getDiploma(localHash);
    assert.equal(revoked.isRevoked, true, "diploma should be revoked");

    let reverted = false;
    try {
      await instance.revokeDiploma(localHash, { from: owner });
    } catch (error) {
      reverted = true;
      assert.include(error.message, "revert");
    }
    assert.equal(reverted, true, "double revoke should revert");
  });

  it("indexes diploma hashes by wallet and studentId", async () => {
    const instance = await DiplomaRegistry.new({ from: owner });
    const h1 = web3.utils.keccak256("A");
    const h2 = web3.utils.keccak256("B");

    await instance.addDiploma(
      h1,
      "CNE55555",
      student,
      "c1:p1",
      "Student One",
      "Genie Civil",
      "2023",
      { from: owner }
    );
    await instance.addDiploma(
      h2,
      "CNE55555",
      student,
      "c2:p2",
      "Student One",
      "Genie Civil",
      "2022",
      { from: owner }
    );

    const byWallet = await instance.getStudentDiplomas(student);
    const byStudentId = await instance.getHashesByStudentId("CNE55555");

    assert.equal(byWallet.length, 2, "wallet should have 2 diplomas");
    assert.equal(byStudentId.length, 2, "studentId should have 2 diplomas");
    assert.equal(byWallet[0], h1);
    assert.equal(byWallet[1], h2);
  });
});
