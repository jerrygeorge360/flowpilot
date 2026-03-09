import AutomationRules from "AutomationRules"
import FlowTransactionSchedulerUtils from "FlowTransactionSchedulerUtils"
import FlowToken from "FlowToken"
import FungibleToken from "FungibleToken"

/// Transaction to deactivate a rule and cancel its scheduled execution
/// This stops the rule from running forever and returns ~50% of remaining fees
transaction(ruleIndex: Int) {
    prepare(signer: auth(BorrowValue, Storage) &Account) {
        // 1. Get rule book safely (avoid typed-borrow mismatch panic)
        var ruleBook: &AutomationRules.RuleBook? = nil
        if signer.storage.borrow<&AnyResource>(from: AutomationRules.RuleBookStoragePath) != nil {
            let existing <- signer.storage.load<@AnyResource>(from: AutomationRules.RuleBookStoragePath)
                ?? panic("Could not load rule book")
            if let rb <- existing as? @AutomationRules.RuleBook {
                signer.storage.save(<-rb, to: AutomationRules.RuleBookStoragePath)
                ruleBook = signer.storage.borrow<&AutomationRules.RuleBook>(from: AutomationRules.RuleBookStoragePath)
                    ?? panic("Could not borrow rule book")
            } else {
                destroy existing
                panic("Legacy rule book found. Create a new rule on the new contract first.")
            }
        } else {
            panic("Could not find rule book")
        }
        let validRuleBook = ruleBook ?? panic("Could not borrow rule book")

        // Get the scheduler ID before deactivation
        let rules = validRuleBook.getRules()
        if rules[ruleIndex].schedulerId == nil {
            panic("Cannot cancel legacy rule without scheduler ID")
        }
        let schedulerId = rules[ruleIndex].schedulerId!

        // 2. Mark rule as inactive in the rule book
        validRuleBook.deactivateRule(index: ruleIndex)

        // 3. Cancel the scheduled transaction in the Flow scheduler
        let manager = signer.storage.borrow<auth(FlowTransactionSchedulerUtils.Owner) &{FlowTransactionSchedulerUtils.Manager}>(
            from: FlowTransactionSchedulerUtils.managerStoragePath
        ) ?? panic("Could not borrow scheduler manager")

        // Cancel the scheduled transaction and receive refund
        let refund <- manager.cancel(id: schedulerId)
        
        // 4. Get the vault to receive the refund
        let vault = signer.storage.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow FlowToken vault")

        // Deposit refund
        vault.deposit(from: <-refund)
    }
}
