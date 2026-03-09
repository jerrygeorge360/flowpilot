import FungibleToken from "FungibleToken"

access(all) contract FlowToken {
    access(all) resource Vault: FungibleToken.Vault {
        access(all) var balance: UFix64

        init(balance: UFix64) {
            self.balance = balance
        }

        access(FungibleToken.Withdraw) fun withdraw(amount: UFix64): @{FungibleToken.Vault} {
            pre {
                self.balance >= amount: "Insufficient balance"
            }
            self.balance = self.balance - amount
            return <-create Vault(balance: amount)
        }

        access(all) fun deposit(from: @{FungibleToken.Vault}) {
            let vault <- from as! @Vault
            self.balance = self.balance + vault.balance
            destroy vault
        }
    }
    
    access(all) fun createEmptyVault(vaultType: Type): @Vault {
        return <-create Vault(balance: 0.0)
    }
}