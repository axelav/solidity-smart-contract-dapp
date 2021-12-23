const main = async () => {
  const waveContractFactory = await hre.ethers.getContractFactory('WavePortal')
  const waveContract = await waveContractFactory.deploy({
    value: hre.ethers.utils.parseEther('0.1'),
  })
  await waveContract.deployed()

  const [owner, randomPerson] = await hre.ethers.getSigners()

  console.log('Contract deployed to:', waveContract.address)
  console.log('Contract deployed by:', owner.address)

  let contractBalance = await hre.ethers.provider.getBalance(
    waveContract.address
  )
  console.log(
    'Contract balance:',
    hre.ethers.utils.formatEther(contractBalance)
  )

  let waveTxn = await waveContract.wave('Initial commit')
  await waveTxn.wait()

  contractBalance = await hre.ethers.provider.getBalance(waveContract.address)
  console.log(
    'Contract balance:',
    hre.ethers.utils.formatEther(contractBalance)
  )

  waveTxn = await waveContract
    .connect(randomPerson)
    .wave('Wow this is pretty darn cool!')
  await waveTxn.wait()

  // TODO
  // waveTxn = await waveContract
  //   .connect(randomPerson)
  //   .wave('This should be handled by the cooldown')
  // await waveTxn.wait()

  contractBalance = await hre.ethers.provider.getBalance(waveContract.address)
  console.log(
    'Contract balance:',
    hre.ethers.utils.formatEther(contractBalance)
  )

  const allWaves = await waveContract.getAllWaves()
  const count = await waveContract.getTotalWaves()
  console.log('Total waves: ', `(${count.toString()})`, allWaves)
}

const init = async () => {
  try {
    await main()
    process.exit(0)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

init()
