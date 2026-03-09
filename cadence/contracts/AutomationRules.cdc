access(all) contract AutomationRules {

    // Events
    access(all) event RuleCreated(owner: Address, actionType: String, amount: UFix64, intervalSeconds: UFix64, schedulerId: UInt64?, ruleIndex: Int)
    access(all) event RuleBookCreated(owner: Address)
    access(all) event RuleExecuted(owner: Address, actionType: String, amount: UFix64, nextExecutionTime: UFix64, nextSchedulerId: UInt64?)
    access(all) event RuleDeactivated(owner: Address, ruleIndex: Int, schedulerId: UInt64)
    access(all) event RuleSchedulerUpdated(owner: Address, ruleIndex: Int, schedulerId: UInt64)

    access(all) struct Rule {
        access(all) let actionType: String
        access(all) let amount: UFix64
        access(all) let intervalSeconds: UFix64
        access(all) var lastExecuted: UFix64
        access(all) var nextExecution: UFix64
        access(all) var active: Bool
        access(all) var schedulerId: UInt64?

        init(actionType: String, amount: UFix64, intervalSeconds: UFix64, schedulerId: UInt64?) {
            self.actionType = actionType
            self.amount = amount
            self.intervalSeconds = intervalSeconds
            self.lastExecuted = getCurrentBlock().timestamp
            self.nextExecution = getCurrentBlock().timestamp + intervalSeconds
            self.active = true
            self.schedulerId = schedulerId
        }

        access(contract) fun setSchedulerId(_ schedulerId: UInt64) {
            self.schedulerId = schedulerId
        }

        access(all) fun markExecuted(nextSchedulerId: UInt64?) {
            self.lastExecuted = getCurrentBlock().timestamp
            self.nextExecution = getCurrentBlock().timestamp + self.intervalSeconds
            self.schedulerId = nextSchedulerId
            if nextSchedulerId == nil {
                self.active = false
            }
        }
        
        access(contract) fun deactivate() {
            self.active = false
        }
    }

    access(all) resource interface RuleBookPublic {
        access(all) fun getRules(): [Rule]
        access(all) fun setSchedulerId(index: Int, schedulerId: UInt64)
        access(all) fun markRuleExecuted(index: Int, nextSchedulerId: UInt64?)
    }

    access(all) resource RuleBook: RuleBookPublic {
        access(all) var rules: [Rule]
        access(all) let ownerAddress: Address

        init(owner: Address) {
            self.rules = []
            self.ownerAddress = owner
        }

        access(all) fun addRule(rule: Rule): Int {
            self.rules.append(rule)
            let idx = self.rules.length - 1
            emit RuleCreated(owner: self.ownerAddress, actionType: rule.actionType, amount: rule.amount, intervalSeconds: rule.intervalSeconds, schedulerId: rule.schedulerId, ruleIndex: idx)
            return idx
        }

        access(all) fun getRules(): [Rule] {
            return self.rules
        }
        
        access(all) fun deactivateRule(index: Int) {
            pre {
                index >= 0 && index < self.rules.length: "Rule index out of bounds"
                self.rules[index].active: "Rule is already inactive"
                self.rules[index].schedulerId != nil: "Cannot deactivate rule without scheduler ID (old rule)"
            }
            let schedulerId = self.rules[index].schedulerId!
            self.rules[index].deactivate()
            emit RuleDeactivated(owner: self.ownerAddress, ruleIndex: index, schedulerId: schedulerId)
        }

        access(all) fun setSchedulerId(index: Int, schedulerId: UInt64) {
            pre {
                index >= 0 && index < self.rules.length: "Rule index out of bounds"
                self.rules[index].active: "Rule is not active"
            }
            self.rules[index].setSchedulerId(schedulerId)
            emit RuleSchedulerUpdated(owner: self.ownerAddress, ruleIndex: index, schedulerId: schedulerId)
        }

        access(all) fun markRuleExecuted(index: Int, nextSchedulerId: UInt64?) {
            pre {
                index >= 0 && index < self.rules.length: "Rule index out of bounds"
                self.rules[index].active: "Rule is not active"
            }
            self.rules[index].markExecuted(nextSchedulerId: nextSchedulerId)
            emit RuleExecuted(
                owner: self.ownerAddress,
                actionType: self.rules[index].actionType,
                amount: self.rules[index].amount,
                nextExecutionTime: self.rules[index].nextExecution,
                nextSchedulerId: nextSchedulerId
            )
        }

        access(all) fun getDueRules(): [Rule] {
            let now = getCurrentBlock().timestamp
            var dueRules: [Rule] = []
            var i = 0
            while i < self.rules.length {
                let rule = self.rules[i]
                if rule.active && rule.nextExecution <= now {
                    dueRules.append(rule)
                }
                i = i + 1
            }
            return dueRules
        }

        access(all) fun executeRule(index: Int) {
            pre {
                index >= 0 && index < self.rules.length: "Rule index out of bounds"
                self.rules[index].active: "Rule is not active"
                self.rules[index].nextExecution <= getCurrentBlock().timestamp: "Rule not yet due"
            }
            self.rules[index].markExecuted(nextSchedulerId: self.rules[index].schedulerId)
            emit RuleExecuted(
                owner: self.ownerAddress,
                actionType: self.rules[index].actionType,
                amount: self.rules[index].amount,
                nextExecutionTime: self.rules[index].nextExecution,
                nextSchedulerId: self.rules[index].schedulerId
            )
        }
    }

    access(all) fun createRuleBook(owner: Address): @RuleBook {
        emit RuleBookCreated(owner: owner)
        return <- create RuleBook(owner: owner)
    }

    access(all) let RuleBookStoragePath: StoragePath
    access(all) let RuleBookPublicPath: PublicPath

    init() {
        self.RuleBookStoragePath = /storage/flowPilotRuleBook
        self.RuleBookPublicPath = /public/flowPilotRuleBook
    }
}
