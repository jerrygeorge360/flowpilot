import AutomationRules from "../contracts/AutomationRules.cdc"

access(all) fun main(address: Address): [AutomationRules.Rule] {
    let account = getAccount(address)
    let ruleBookRef = account.capabilities.borrow<&{AutomationRules.RuleBookPublic}>(
        AutomationRules.RuleBookPublicPath
    )
        ?? panic("No rule book capability")
    return ruleBookRef.getRules()
}
