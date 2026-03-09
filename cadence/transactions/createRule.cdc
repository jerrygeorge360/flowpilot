import AutomationRules from "AutomationRules"
import VaultSaveHandler from "VaultSaveHandler"
import FlowTransactionScheduler from "FlowTransactionScheduler"
import FlowTransactionSchedulerUtils from "FlowTransactionSchedulerUtils"
import FlowToken from "FlowToken"
import FungibleToken from "FungibleToken"

transaction(actionType: String, amount: UFix64, intervalSeconds: UFix64) {
    prepare(signer: auth(BorrowValue, SaveValue, Storage, Capabilities) &Account) {
        // 1. Initialize/migrate RuleBook safely (do not typed-borrow first)
        if signer.storage.borrow<&AnyResource>(from: AutomationRules.RuleBookStoragePath) != nil {
            let existing <- signer.storage.load<@AnyResource>(from: AutomationRules.RuleBookStoragePath)
                ?? panic("Failed to load existing rule book resource")

            if let currentRuleBook <- existing as? @AutomationRules.RuleBook {
                signer.storage.save(<-currentRuleBook, to: AutomationRules.RuleBookStoragePath)
            } else {
                destroy existing
                signer.storage.save(<- AutomationRules.createRuleBook(owner: signer.address), to: AutomationRules.RuleBookStoragePath)
            }
        } else {
            signer.storage.save(<- AutomationRules.createRuleBook(owner: signer.address), to: AutomationRules.RuleBookStoragePath)
        }

        // 2. Initialize manager if needed
        if !signer.storage.check<@{FlowTransactionSchedulerUtils.Manager}>(from: FlowTransactionSchedulerUtils.managerStoragePath) {
            let manager <- FlowTransactionSchedulerUtils.createManager()
            signer.storage.save(<-manager, to: FlowTransactionSchedulerUtils.managerStoragePath)

            let managerRef = signer.capabilities.storage.issue<&{FlowTransactionSchedulerUtils.Manager}>(
                FlowTransactionSchedulerUtils.managerStoragePath
            )
            signer.capabilities.publish(managerRef, at: FlowTransactionSchedulerUtils.managerPublicPath)
        }

        // 3. Prepare scheduling params
        let executionEffort: UInt64 = 1000
        let priority = FlowTransactionScheduler.Priority.Medium

        // 4. Get entitled handler capability (order of controllers is not guaranteed)
        var handlerCap: Capability<auth(FlowTransactionScheduler.Execute) &{FlowTransactionScheduler.TransactionHandler}>? = nil
        let controllers = signer.capabilities.storage.getControllers(forPath: /storage/VaultSaveHandler)
        for controller in controllers {
            if let cap = controller.capability as? Capability<auth(FlowTransactionScheduler.Execute) &{FlowTransactionScheduler.TransactionHandler}> {
                handlerCap = cap
                break
            }
        }
        let validHandlerCap = handlerCap
            ?? panic("Missing entitled handler capability. Run initVaultSaveHandler first.")

        // 5. Create save data
        let ruleBook = signer.storage.borrow<&AutomationRules.RuleBook>(from: AutomationRules.RuleBookStoragePath)
            ?? panic("Could not borrow rule book")

        let rule = AutomationRules.Rule(
            actionType: actionType,
            amount: amount,
            intervalSeconds: intervalSeconds,
            schedulerId: nil
        )
        let ruleIndex = ruleBook.addRule(rule: rule)

        let ruleBookCap = signer.capabilities.storage.issue<&{AutomationRules.RuleBookPublic}>(
            AutomationRules.RuleBookStoragePath
        )

        let tempManagerCap = signer.capabilities.storage.issue<auth(FlowTransactionSchedulerUtils.Owner) &{FlowTransactionSchedulerUtils.Manager}>(
            FlowTransactionSchedulerUtils.managerStoragePath
        )
        let tempVaultCap = signer.capabilities.storage.issue<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            /storage/flowTokenVault
        )
        
        let saveData = VaultSaveHandler.SaveData(
            owner: signer.address,
            ruleIndex: ruleIndex,
            amount: amount,
            intervalSeconds: intervalSeconds,
            ruleBookCap: ruleBookCap,
            managerOwnerCap: tempManagerCap,
            flowTokenVaultCap: tempVaultCap
        )

        let dataSizeMB = FlowTransactionScheduler.getSizeOfData(saveData)
        let estimatedFee = FlowTransactionScheduler.calculateFee(
            executionEffort: executionEffort,
            priority: priority,
            dataSizeMB: dataSizeMB
        )

        let flowTokenVaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow FlowToken vault")
        let fees <- flowTokenVaultRef.withdraw(amount: estimatedFee) as! @FlowToken.Vault

        // 6. Schedule first execution and capture the scheduler ID
        let manager = signer.storage.borrow<auth(FlowTransactionSchedulerUtils.Owner) &{FlowTransactionSchedulerUtils.Manager}>(
            from: FlowTransactionSchedulerUtils.managerStoragePath
        ) ?? panic("Could not borrow scheduler manager")

        let schedulerId = manager.schedule(
            handlerCap: validHandlerCap,
            data: saveData,
            timestamp: getCurrentBlock().timestamp + intervalSeconds,
            priority: priority,
            executionEffort: executionEffort,
            fees: <-fees
        )

        // 7. Persist initial scheduler ID to the just-created rule
        ruleBook.setSchedulerId(index: ruleIndex, schedulerId: schedulerId)

        log("Scheduled rule created: \(actionType) - \(amount) FLOW every \(intervalSeconds) seconds (Rule Index: \(ruleIndex), Scheduler ID: \(schedulerId))")
    }
}
