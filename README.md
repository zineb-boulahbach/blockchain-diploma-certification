# Blockchain Diploma Certification

Systeme decentralise de certification et de verification des diplomes academiques.

Le projet contient:
- un smart contract `DiplomaRegistry` (Truffle + Solidity),
- une interface web React/Vite (`client/`),
- une integration IPFS (Pinata) pour stocker le PDF et son metadata JSON.

## 1) Prerequis

- Node.js 20+ (LTS recommande)
- npm 10+
- MetaMask (extension navigateur)
- (Optionnel) Ganache CLI/local pour le reseau local

> Note: sous Node.js 22, Truffle peut afficher un warning `uws` sans bloquer l'execution.

## 2) Installation

Depuis la racine du projet:

```bash
npm run setup
```

Ce script installe les dependances de la racine et de `client/`.

## 3) Configuration front-end

1. Copier le fichier d'exemple:

```bash
copy client\.env.example client\.env
```

2. Renseigner les variables dans `client/.env`:

- `VITE_CONTRACT_ADDRESS`: adresse du contrat deploye
- `VITE_RPC_URL`: RPC du reseau cible (local ou Sepolia)
- `VITE_EXPECTED_CHAIN_ID`: `1337` (local Ganache) ou `11155111` (Sepolia)
- `VITE_LOGS_FROM_BLOCK`: bloc de depart pour les lectures d'evenements
- `VITE_PINATA_JWT` (optionnel): token Pinata pour upload IPFS reelle

Si `VITE_PINATA_JWT` est vide, l'app utilise un mode demo local pour les CIDs.

## 4) Deploiement Sepolia (pret production demo)

1. Copier l'exemple backend/deploiement:

```bash
copy .env.example .env
```

2. Renseigner dans `.env` **à la racine du projet** ou dans `client/.env` :

- `DEPLOYER_PRIVATE_KEY` (compte de deploiement)
- `SEPOLIA_RPC_URL` (Infura/Alchemy/QuickNode)

Les deux fichiers sont fusionnés pour Truffle : une valeur vide dans `.env` racine peut être complétée par `client/.env`.

3. Deployer le contrat:

```bash
npm run deploy:sepolia
```

4. Reporter l'adresse de `DiplomaRegistry` dans `client/.env`:

```env
VITE_CONTRACT_ADDRESS=0x...
VITE_RPC_URL=https://sepolia.infura.io/v3/...
VITE_EXPECTED_CHAIN_ID=11155111
```

## 5) Lancement en local (workflow recommande)

### Terminal A - Blockchain locale

```bash
npm run ganache
```

### Terminal B - Deploiement contrat

```bash
npm run migrate
```

Recuperer l'adresse de `DiplomaRegistry` et la placer dans `client/.env`:

```env
VITE_CONTRACT_ADDRESS=0x...
VITE_RPC_URL=http://127.0.0.1:7545
VITE_EXPECTED_CHAIN_ID=1337
```

### Terminal C - Front-end

```bash
npm run client
```

URL locale: `http://localhost:5173`

## 6) Build et tests

### Build front-end

```bash
npm run build:client
```

### Compilation contrats

```bash
npm run compile
```

### Tests smart contract

```bash
npm test
```

### Depannage migration Sepolia

- Message **network at undefined** : le provider expose `host` pour Truffle.
- **`Invalid JSON RPC response: {}` / `gasLimit` undefined** : souvent rate-limit ou rafales de requetes vers Infura. Le projet utilise `scripts/retrying-json-rpc-provider.js` (retries + une seule connexion HTTP parallele) pour stabiliser les migrations.
- **Migration interrompue apres "Deploying DiplomaRegistry"** : si la console affiche une adresse de contrat et un `transaction hash`, le deploiement on-chain peut etre reussi malgre l'erreur Truffle. Verifiez sur [Sepolia Etherscan](https://sepolia.etherscan.io/). Mettez cette adresse dans `VITE_CONTRACT_ADDRESS`. Evitez `npm run migrate:sepolia` sans `--reset` dans ce cas : Truffle pourrait redeployer un second `DiplomaRegistry`. Pour un etat propre, refaire `npm run deploy:sepolia` avec le provider a jour (nouveau deploiement complet).
- **Timeout** : verifier `SEPOLIA_RPC_URL`, firewall/VPN, ETH Sepolia sur le compte deployeur.
- `networkCheckTimeout` : 90s sur le reseau `sepolia`.

La suite couvre:
- ownership au deploiement,
- ajout et lecture d'un diplome,
- controle d'acces owner/non-owner,
- revocation + prevention double revocation,
- indexation des diplomes par wallet et studentId.

## 7) Utilisation fonctionnelle

- **Admin / Emission**:
  - saisir les informations et wallet etudiant,
  - uploader le PDF,
  - signer la transaction MetaMask pour enregistrer le hash on-chain.
- **Verification**:
  - rechercher un diplome par hash/ID,
  - verifier le statut (valide/revoque) et les metadata.
- **Etudiant**:
  - consulter ses diplomes lies a son wallet.

## 8) Checklist avant soutenance/demo

- [ ] Le contrat est deployee sur le reseau cible
- [ ] Si Sepolia: `.env` (racine) configure
- [ ] `VITE_CONTRACT_ADDRESS` est correct
- [ ] MetaMask est connecte au bon `chainId`
- [ ] Au moins 1 diplome est emet pour la demonstration
- [ ] `npm test` passe
- [ ] `npm run build:client` passe

## 9) Structure principale

```text
contracts/                 Solidity contracts
migrations/                Truffle migrations
test/                      Smart contract tests
client/src/                React app
client/src/admin/          Admin flows
client/src/pages/          Student + verify pages
```