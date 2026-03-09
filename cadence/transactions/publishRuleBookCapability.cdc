import AutomationRulesV2 from "AutomationRulesV2"

transaction {
    prepare(signer: auth(Capabilities) &Account) {
        // Check if capability already exists and is valid
        let existingCap = signer.capabilities.get<&{AutomationRulesV2.RuleBookPublic}>(AutomationRulesV2.RuleBookPublicPath)
        
        if !existingCap.check() {
            // Issue and publish the capability
            let ruleBookPublicCap = signer.capabilities.storage.issue<&{AutomationRulesV2.RuleBookPublic}>(
                AutomationRulesV2.RuleBookStoragePath
            )
            signer.capabilities.publish(ruleBookPublicCap, at: AutomationRulesV2.RuleBookPublicPath)
        }
    }
}
