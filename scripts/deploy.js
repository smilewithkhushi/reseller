async function main() {
  const ProductProvenance = await ethers.getContractFactory("ProductProvenance");
  const contract = await ProductProvenance.deploy();
  await contract.deployed();
  console.log("Contract deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});