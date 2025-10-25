const hre = require('hardhat');

async function main() {
  console.log('Deploying BaseNFT contract to Base network...');

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying with account:', deployer.address);

  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log('Account balance:', hre.ethers.formatEther(balance), 'ETH');

  // Contract parameters
  const name = 'Base Telegram NFT';
  const symbol = 'BTNFT';
  const mintPrice = hre.ethers.parseEther('0.00003'); // 0.00003 ETH mint price
  const maxSupply = 0; // Unlimited supply (change as needed)

  console.log('\nContract parameters:');
  console.log('Name:', name);
  console.log('Symbol:', symbol);
  console.log('Mint Price:', hre.ethers.formatEther(mintPrice), 'ETH');
  console.log('Max Supply:', maxSupply === 0 ? 'Unlimited' : maxSupply);

  // Deploy contract
  console.log('\nDeploying contract...');
  const BaseNFT = await hre.ethers.getContractFactory('BaseNFT');
  const baseNFT = await BaseNFT.deploy(name, symbol, mintPrice, maxSupply);

  await baseNFT.waitForDeployment();

  const contractAddress = await baseNFT.getAddress();
  console.log('\nBaseNFT deployed to:', contractAddress);

  // Wait for a few block confirmations
  console.log('\nWaiting for block confirmations...');
  await baseNFT.deploymentTransaction().wait(5);

  console.log('\n========================================');
  console.log('Deployment Summary');
  console.log('========================================');
  console.log('Contract Address:', contractAddress);
  console.log('Network:', hre.network.name);
  console.log('Deployer:', deployer.address);
  console.log('========================================');

  console.log('\nTo verify the contract, run:');
  console.log(`npx hardhat verify --network ${hre.network.name} ${contractAddress} "${name}" "${symbol}" "${mintPrice}" "${maxSupply}"`);

  console.log('\nUpdate your .env file with:');
  console.log(`CONTRACT_ADDRESS=${contractAddress}`);

  // Save deployment info
  const fs = require('fs');
  const deploymentInfo = {
    contractAddress,
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    parameters: { name, symbol, mintPrice: mintPrice.toString(), maxSupply }
  };

  fs.writeFileSync(
    `deployments/${hre.network.name}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log('\nDeployment info saved to deployments/' + hre.network.name + '.json');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
