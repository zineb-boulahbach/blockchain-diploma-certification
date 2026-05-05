export const DIPLOMA_REGISTRY_ABI = [
  'function owner() view returns (address)',
  'function addDiploma(bytes32,string,address,string,string,string,string)',
  'function revokeDiploma(bytes32)',
  'function getDiploma(bytes32) view returns (tuple(bytes32 diplomaHash,string studentId,address studentWallet,uint256 issuanceDate,bool isRevoked,string ipfsCID,string studentName,string filiere,string yearObtained))',
  'function getStudentDiplomas(address) view returns (bytes32[])',
  'function getHashesByStudentId(string) view returns (bytes32[])',
  'function diplomaExists(bytes32) view returns (bool)',
  'event DiplomaAdded(bytes32 indexed diplomaHash,string studentId,address indexed studentWallet)',
  'event DiplomaRevoked(bytes32 indexed diplomaHash)',
] as const;
