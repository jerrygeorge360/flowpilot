import FlowTransactionScheduler from "FlowTransactionScheduler"
import FlowTransactionSchedulerUtils from "FlowTransactionSchedulerUtils"
import FlowPilotVault from "FlowPilotVault"
import AutomationRules from "AutomationRules"
import FlowToken from "FlowToken"
import FungibleToken from "FungibleToken"

access(all) contract VaultSaveHandler {
    
    // Event emitted when a scheduled save executes
    access(all) event ScheduledSaveExecuted(owner: Address, amount: UFix64, txId: UInt64, ruleIndex: Int, rescheduled: Bool, nextSchedulerId: UInt64?)
    
    access(all) struct SaveData {
        access(all) let owner: Address
        access(all) let ruleIndex: Int
        access(all) let amount: UFix64
        access(all) let intervalSeconds: UFix64
        access(all) let ruleBookCap: Capability<&{AutomationRules.RuleBookPublic}>
        access(all) let managerOwnerCap: Capability<auth(FlowTransactionSchedulerUtils.Owner) &{FlowTransactionSchedulerUtils.Manager}>
        access(all) let flowTokenVaultCap: Capability<auth(FungibleToken.Withdraw) &FlowToken.Vault>
        
        init(
            owner: Address,
            ruleIndex: Int,
            amount: UFix64,
            intervalSeconds: UFix64,
            ruleBookCap: Capability<&{AutomationRules.RuleBookPublic}>,
            managerOwnerCap: Capability<auth(FlowTransactionSchedulerUtils.Owner) &{FlowTransactionSchedulerUtils.Manager}>,
            flowTokenVaultCap: Capability<auth(FungibleToken.Withdraw) &FlowToken.Vault>
        ) {
            self.owner = owner
            self.ruleIndex = ruleIndex
            self.amount = amount
            self.intervalSeconds = intervalSeconds
            self.ruleBookCap = ruleBookCap
            self.managerOwnerCap = managerOwnerCap
            self.flowTokenVaultCap = flowTokenVaultCap
        }
    }
    
    access(all) resource Handler: FlowTransactionScheduler.TransactionHandler {
        access(FlowTransactionScheduler.Execute) fun executeTransaction(id: UInt64, data: AnyStruct?) {
            let saveData = data as! SaveData? ?? panic("Invalid save data")
            let owner = saveData.owner
            let ruleIndex = saveData.ruleIndex
            let amount = saveData.amount
            let intervalSeconds = saveData.intervalSeconds
            let ruleBook = saveData.ruleBookCap.borrow()
                ?? panic("Could not borrow rule book capability")
            
            // 1. Execute the deposit to the user's vault
            let ownerAccount = getAccount(owner)
            let vaultCap = ownerAccount.capabilities.borrow<&FlowPilotVault.Vault>(FlowPilotVault.VaultPublicPath)
                ?? panic("Could not borrow vault capability")
            
            vaultCap.deposit(amount: amount, owner: owner)
            
            // 2. For recurring rules, reschedule itself using manager.scheduleByHandler(...)
            var shouldReschedule = false
            var nextSchedulerId: UInt64? = nil
            if intervalSeconds > 0.0 {
                let manager = saveData.managerOwnerCap.borrow()
                    ?? panic("Could not borrow manager owner capability")

                let tokenVault = saveData.flowTokenVaultCap.borrow()
                    ?? panic("Could not borrow FlowToken withdraw capability")

                let priority = FlowTransactionScheduler.Priority.Medium
                let executionEffort: UInt64 = 1000
                let dataSizeMB = FlowTransactionScheduler.getSizeOfData(saveData)
                let estimatedFee = FlowTransactionScheduler.calculateFee(
                    executionEffort: executionEffort,
                    priority: priority,
                    dataSizeMB: dataSizeMB
                )
                let fees <- tokenVault.withdraw(amount: estimatedFee) as! @FlowToken.Vault

                let rescheduledId = manager.scheduleByHandler(
                    handlerTypeIdentifier: self.getType().identifier,
                    handlerUUID: self.uuid,
                    data: saveData,
                    timestamp: getCurrentBlock().timestamp + intervalSeconds,
                    priority: priority,
                    executionEffort: executionEffort,
                    fees: <-fees
                )

                shouldReschedule = true
                nextSchedulerId = rescheduledId
            }

            // 3. Persist latest scheduler ID and execution state in RuleBook
            ruleBook.markRuleExecuted(index: ruleIndex, nextSchedulerId: nextSchedulerId)
            
            // Emit event for activity tracking
            emit ScheduledSaveExecuted(owner: owner, amount: amount, txId: id, ruleIndex: ruleIndex, rescheduled: shouldReschedule, nextSchedulerId: nextSchedulerId)
        }
        
        access(all) view fun getViews(): [Type] {
            return [Type<StoragePath>(), Type<PublicPath>()]
        }
        
        access(all) fun resolveView(_ view: Type): AnyStruct? {
            switch view {
                case Type<StoragePath>():
                    return /storage/VaultSaveHandler
                case Type<PublicPath>():
                    return /public/VaultSaveHandler
                default:
                    return nil
            }
        }
    }
    
    access(all) fun createHandler(): @Handler {
        return <- create Handler()
    }
}
