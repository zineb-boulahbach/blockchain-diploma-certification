const DiplomaRegistry = artifacts.require("DiplomaRegistry");

module.exports = function (deployer) {
  deployer.deploy(DiplomaRegistry);
};
