import { ethers } from 'ethers'
import UpgradeExecutor from '@arbitrum/nitro-contracts/build/contracts/src/mocks/UpgradeExecutorMock.sol/UpgradeExecutorMock.json'
import { getSigner } from './erc20TokenBridgeDeployment'
import { getExecutorAddress } from './getExecutorAddressImpl'

async function main() {
  // Read the environment variables
  const PRIVATE_KEY = process.env.PRIVATE_KEY
  const L2_RPC_URL = process.env.L2_RPC_URL
  const L3_RPC_URL = process.env.L3_RPC_URL
  // Provide either TOKEN_BRIDGE_CREATOR and INBOX, or just UPGRADE_EXECUTOR
  const TOKEN_BRIDGE_CREATOR = process.env.TOKEN_BRIDGE_CREATOR || ''
  const INBOX = process.env.INBOX || ''
  const UPGRADE_EXECUTOR_PROXY = process.env.UPGRADE_EXECUTOR_PROXY
  const OPERATOR = process.env.OPERATOR
  if (!PRIVATE_KEY || !L2_RPC_URL || !L3_RPC_URL || !OPERATOR) {
    throw new Error('Required environment variable not found')
  }

  // Generating providers from RPCs
  const L2Provider = new ethers.providers.JsonRpcProvider(L2_RPC_URL)
  const L3Provider = new ethers.providers.JsonRpcProvider(L3_RPC_URL)
  const l3Deployer = getSigner(L3Provider, PRIVATE_KEY)

  let executorContractAddress = ''
  if (!UPGRADE_EXECUTOR_PROXY) {
    console.log(`UPGRADE_EXECUTOR_PROXY is not provided, getting address...`)
    executorContractAddress = await getExecutorAddress(
      TOKEN_BRIDGE_CREATOR,
      INBOX,
      L2Provider,
      L3Provider
    )
  } else {
    console.log(`UPGRADE_EXECUTOR_PROXY is provided`)
    executorContractAddress = UPGRADE_EXECUTOR_PROXY
  }
  console.log('executor address:', executorContractAddress)

  // Defining upgrade executor contract
  const executorContract__factory = new ethers.Contract(
    executorContractAddress,
    UpgradeExecutor.abi,
    l3Deployer
  )
  const upgradeExecutor = executorContract__factory.connect(l3Deployer)

  const executorRole = await upgradeExecutor.EXECUTOR_ROLE()
  const hasExecutorRole = await upgradeExecutor.hasRole(executorRole, OPERATOR)
  console.log('has executor role:', hasExecutorRole)

  const adminRole = await upgradeExecutor.ADMIN_ROLE()
  const hasAdminRole = await upgradeExecutor.hasRole(adminRole, OPERATOR)
  console.log('has admin role:', hasAdminRole)
}

// Run the script
main().catch(error => {
  console.error(error)
  process.exit(1)
})
