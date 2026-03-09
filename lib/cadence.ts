import { fcl } from "./flow";

const VAULT_CONTRACT = process.env.NEXT_PUBLIC_VAULT_CONTRACT ?? "0xFLOWPILOT";

/**
 * Request sponsorship for a transaction from the backend
 * Returns sponsorship status and remaining free transactions
 */
export async function requestSponsorship(userAddress: string) {
  try {
    const response = await fetch("/api/sponsor-transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userAddress }),
    });

    if (!response.ok) {
      console.warn("Sponsorship request failed, user will pay gas");
      return { sponsored: false };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn("Sponsorship request error:", error);
    return { sponsored: false };
  }
}

/**
 * Get current sponsorship status for a user (read-only)
 */
export async function getSponsorsipStatus(userAddress: string) {
  try {
    const response = await fetch(
      `/api/sponsor-transaction?address=${encodeURIComponent(userAddress)}`
    );

    if (!response.ok) {
      return { sponsored: false, remaining: 0 };
    }

    return await response.json();
  } catch (error) {
    console.warn("Sponsorship status check failed:", error);
    return { sponsored: false, remaining: 0 };
  }
}

export async function depositToVault(amount: number, userAddress?: string) {
  console.log("[depositToVault] Starting deposit of", amount, "FLOW");
  const authz = (fcl as any).authz;
  if (userAddress) {
    console.log("[depositToVault] Requesting sponsorship for", userAddress);
    // Best effort call; transaction still uses wallet payer until sponsor signing is implemented.
    await requestSponsorship(userAddress);
  }

  console.log("[depositToVault] Calling fcl.mutate - wallet should popup now");
  const txId = await fcl.mutate({
    cadence: `
      import FlowPilotVault from ${VAULT_CONTRACT}
      transaction(amount: UFix64) {
        prepare(signer: auth(BorrowValue) &Account) {
          let vault = signer.storage.borrow<&FlowPilotVault.Vault>(from: FlowPilotVault.VaultStoragePath)
            ?? panic("No vault found")
          vault.deposit(amount: amount, owner: signer.address)
        }
      }
    `,
    args: (arg: any, t: any) => [arg(amount.toFixed(8), t.UFix64)],
    proposer: authz,
    payer: authz,
    authorizations: [authz],
    limit: 999,
  });

  await fcl.tx(txId).onceSealed();

  return txId;
}

export async function withdrawFromVault(amount: number, userAddress?: string) {
  console.log("[withdrawFromVault] Starting withdrawal of", amount, "FLOW");
  const authz = (fcl as any).authz;
  if (userAddress) {
    console.log("[withdrawFromVault] Requesting sponsorship for", userAddress);
    await requestSponsorship(userAddress);
  }

  console.log("[withdrawFromVault] Calling fcl.mutate - wallet should popup now");
  const txId = await fcl.mutate({
    cadence: `
      import FlowPilotVault from ${VAULT_CONTRACT}
      transaction(amount: UFix64) {
        prepare(signer: auth(BorrowValue) &Account) {
          let vault = signer.storage.borrow<&FlowPilotVault.Vault>(from: FlowPilotVault.VaultStoragePath)
            ?? panic("No vault found. Please initialize first")
          let _ = vault.withdraw(amount: amount, owner: signer.address)
        }
      }
    `,
    args: (arg: any, t: any) => [arg(amount.toFixed(8), t.UFix64)],
    proposer: authz,
    payer: authz,
    authorizations: [authz],
    limit: 999,
  });

  await fcl.tx(txId).onceSealed();

  return txId;
}

export async function getVaultBalance(address: string): Promise<number> {
  try {
    const result = await fcl.query({
      cadence: `
        import FlowPilotVault from ${VAULT_CONTRACT}
        access(all) fun main(address: Address): UFix64 {
          let account = getAccount(address)
          let vault = account.capabilities.borrow<&FlowPilotVault.Vault>(FlowPilotVault.VaultPublicPath)
          if vault == nil {
            return 0.0
          }
          return vault!.getBalanceWithYield()
        }
      `,
      args: (arg: any, t: any) => [arg(address, t.Address)],
    });
    return parseFloat(result);
  } catch (error) {
    console.error("Get balance error:", error);
    return 0.0;
  }
}

export type VaultMetrics = {
  balance: number;
  principal: number;
  pendingYield: number;
  apy: number;
};

export async function getVaultMetrics(address: string): Promise<VaultMetrics> {
  try {
    const result = await fcl.query({
      cadence: `
        import FlowPilotVault from ${VAULT_CONTRACT}

        access(all) struct VaultMetrics {
          access(all) let balanceWithYield: UFix64
          access(all) let principal: UFix64
          access(all) let pendingYield: UFix64
          access(all) let apyBps: UFix64

          init(balanceWithYield: UFix64, principal: UFix64, pendingYield: UFix64, apyBps: UFix64) {
            self.balanceWithYield = balanceWithYield
            self.principal = principal
            self.pendingYield = pendingYield
            self.apyBps = apyBps
          }
        }

        access(all) fun main(address: Address): VaultMetrics {
          let account = getAccount(address)
          let vault = account.capabilities.borrow<&FlowPilotVault.Vault>(FlowPilotVault.VaultPublicPath)
          if vault == nil {
            return VaultMetrics(balanceWithYield: 0.0, principal: 0.0, pendingYield: 0.0, apyBps: FlowPilotVault.APYBps)
          }

          let principal = vault!.balance
          let pending = vault!.pendingYield()
          let total = principal + pending
          let apyBps: UFix64 = FlowPilotVault.APYBps

          return VaultMetrics(balanceWithYield: total, principal: principal, pendingYield: pending, apyBps: apyBps)
        }
      `,
      args: (arg: any, t: any) => [arg(address, t.Address)],
    }) as any;

    return {
      balance: parseFloat(result.balanceWithYield ?? "0"),
      principal: parseFloat(result.principal ?? "0"),
      pendingYield: parseFloat(result.pendingYield ?? "0"),
      apy: parseFloat(result.apyBps ?? "0") / 100,
    };
  } catch (error) {
    console.error("Get vault metrics error:", error);
    return { balance: 0, principal: 0, pendingYield: 0, apy: 5 };
  }
}

export async function hasVault(address: string): Promise<boolean> {
  try {
    const result = await fcl.query({
      cadence: `
        import FlowPilotVault from ${VAULT_CONTRACT}
        access(all) fun main(address: Address): Bool {
          let account = getAccount(address)
          let vault = account.capabilities.borrow<&FlowPilotVault.Vault>(FlowPilotVault.VaultPublicPath)
          return vault != nil
        }
      `,
      args: (arg: any, t: any) => [arg(address, t.Address)],
    });

    return Boolean(result);
  } catch (error) {
    console.error("Has vault check error:", error);
    return false;
  }
}

export async function initializeVault(userAddress?: string) {
  console.log("[initializeVault] Initializing vault for", userAddress);
  const authz = (fcl as any).authz;
  if (userAddress) {
    console.log("[initializeVault] Requesting sponsorship for", userAddress);
    // Best effort call; transaction still uses wallet payer until sponsor signing is implemented.
    await requestSponsorship(userAddress);
  }

  console.log("[initializeVault] Calling fcl.mutate - wallet should popup now");
  const txId = await fcl.mutate({
    cadence: `
      import FlowPilotVault from ${VAULT_CONTRACT}
      transaction {
        prepare(signer: auth(SaveValue, LoadValue, BorrowValue, Capabilities, IssueStorageCapabilityController, PublishCapability, UnpublishCapability) &Account) {
          // IMPORTANT: never typed-borrow first here; mismatched stored types panic.
          if signer.storage.borrow<&AnyResource>(from: FlowPilotVault.VaultStoragePath) != nil {
            let existing <- signer.storage.load<@AnyResource>(from: FlowPilotVault.VaultStoragePath)
              ?? panic("Failed to load existing vault resource")

            if let currentVault <- existing as? @FlowPilotVault.Vault {
              signer.storage.save(<-currentVault, to: FlowPilotVault.VaultStoragePath)
              return
            }

            // Legacy/incompatible resource at same path.
            destroy existing
          }

          let vault <- FlowPilotVault.createVault(owner: signer.address)

          signer.storage.save(<-vault, to: FlowPilotVault.VaultStoragePath)

          // Replace stale public capability (old contract type) with new one
          let _ = signer.capabilities.unpublish(FlowPilotVault.VaultPublicPath)
          let cap = signer.capabilities.storage.issue<&FlowPilotVault.Vault>(FlowPilotVault.VaultStoragePath)
          signer.capabilities.publish(cap, at: FlowPilotVault.VaultPublicPath)
        }
      }
    `,
    proposer: authz,
    payer: authz,
    authorizations: [authz],
    limit: 999,
  });

  await fcl.tx(txId).onceSealed();

  return txId;
}

export async function publishRuleBookCapability(userAddress?: string) {
  console.log("[publishRuleBookCapability] Publishing RuleBook capability for", userAddress);
  const authz = (fcl as any).authz;
  
  const txId = await fcl.mutate({
    cadence: `
      import AutomationRulesV2 from ${VAULT_CONTRACT}

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
    `,
    args: () => [],
    proposer: authz,
    payer: authz,
    authorizations: [authz],
    limit: 999,
  });

  await fcl.tx(txId).onceSealed();
  console.log("[publishRuleBookCapability] ✅ Capability published! TX:", txId);
  return txId;
}

export async function createAutomationRule(
  actionType: string,
  amount: number,
  intervalDays: number,
  userAddress?: string
) {
  console.log("[createAutomationRule] Creating rule:", actionType, amount, intervalDays);
  const authz = (fcl as any).authz;
  
  if (userAddress) {
    console.log("[createAutomationRule] Requesting sponsorship for", userAddress);
    await requestSponsorship(userAddress);
  }

  const intervalSeconds = intervalDays * 24 * 60 * 60;

  // Single transaction that does EVERYTHING:
  // 1. Init handler (if needed)
  // 2. Init manager (if needed)
  // 3. Create rule metadata
  // 4. Schedule with Flow scheduler
  console.log("[createAutomationRule] Submitting ONE-CLICK setup transaction...");
  const txId = await fcl.mutate({
    cadence: `
      import VaultSaveHandlerV2 from ${VAULT_CONTRACT}
      import AutomationRulesV2 from ${VAULT_CONTRACT}
      import FlowTransactionScheduler from 0x8c5303eaa26202d6
      import FlowTransactionSchedulerUtils from 0x8c5303eaa26202d6
      import FlowToken from 0x7e60df042a9c0868
      import FungibleToken from 0x9a0766d93b6608b7
      
      transaction(actionType: String, amount: UFix64, intervalSeconds: UFix64) {
        prepare(signer: auth(BorrowValue, SaveValue, Storage, Capabilities) &Account) {
          // ═══ STEP 1: Initialize handler (idempotent) ═══
          if signer.storage.borrow<&AnyResource>(from: /storage/VaultSaveHandlerV2) == nil {
            let handler <- VaultSaveHandlerV2.createHandler()
            signer.storage.save(<-handler, to: /storage/VaultSaveHandlerV2)
          }

          let _ = signer.capabilities.storage.issue<auth(FlowTransactionScheduler.Execute) &{FlowTransactionScheduler.TransactionHandler}>(
            /storage/VaultSaveHandlerV2
          )

          let existingPublicCap = signer.capabilities.get<&{FlowTransactionScheduler.TransactionHandler}>(/public/VaultSaveHandlerV2)
          if !existingPublicCap.check() {
            let publicCap = signer.capabilities.storage.issue<&{FlowTransactionScheduler.TransactionHandler}>(
              /storage/VaultSaveHandlerV2
            )
            signer.capabilities.publish(publicCap, at: /public/VaultSaveHandlerV2)
          }

          // ═══ STEP 2: Initialize/migrate RuleBook safely ═══
          // IMPORTANT: do not typed-borrow first; legacy RuleBook type at same path will panic.
          if signer.storage.borrow<&AnyResource>(from: AutomationRulesV2.RuleBookStoragePath) != nil {
            let existing <- signer.storage.load<@AnyResource>(from: AutomationRulesV2.RuleBookStoragePath)
              ?? panic("Failed to load existing rule book resource")

            if let currentRuleBook <- existing as? @AutomationRulesV2.RuleBook {
              signer.storage.save(<-currentRuleBook, to: AutomationRulesV2.RuleBookStoragePath)
            } else {
              destroy existing
              signer.storage.save(<- AutomationRulesV2.createRuleBook(owner: signer.address), to: AutomationRulesV2.RuleBookStoragePath)
            }
          } else {
            signer.storage.save(<- AutomationRulesV2.createRuleBook(owner: signer.address), to: AutomationRulesV2.RuleBookStoragePath)
          }

          // Publish RuleBook public capability (idempotent)
          let existingRuleBookCap = signer.capabilities.get<&{AutomationRulesV2.RuleBookPublic}>(AutomationRulesV2.RuleBookPublicPath)
          if !existingRuleBookCap.check() {
            let ruleBookPublicCap = signer.capabilities.storage.issue<&{AutomationRulesV2.RuleBookPublic}>(
              AutomationRulesV2.RuleBookStoragePath
            )
            signer.capabilities.publish(ruleBookPublicCap, at: AutomationRulesV2.RuleBookPublicPath)
          }
          
          // ═══ STEP 3: Initialize scheduler manager (idempotent) ═══
          if !signer.storage.check<@{FlowTransactionSchedulerUtils.Manager}>(from: FlowTransactionSchedulerUtils.managerStoragePath) {
            let manager <- FlowTransactionSchedulerUtils.createManager()
            signer.storage.save(<-manager, to: FlowTransactionSchedulerUtils.managerStoragePath)
            let managerRef = signer.capabilities.storage.issue<&{FlowTransactionSchedulerUtils.Manager}>(
              FlowTransactionSchedulerUtils.managerStoragePath
            )
            signer.capabilities.publish(managerRef, at: FlowTransactionSchedulerUtils.managerPublicPath)
          }
          
          // ═══ STEP 4: Schedule with Flow network ═══
          let executionEffort: UInt64 = 1000
          let priority = FlowTransactionScheduler.Priority.Medium
          
          // Get entitled handler capability
          var handlerCap: Capability<auth(FlowTransactionScheduler.Execute) &{FlowTransactionScheduler.TransactionHandler}>? = nil
          let controllers = signer.capabilities.storage.getControllers(forPath: /storage/VaultSaveHandlerV2)
          if controllers.length > 0 {
            for controller in controllers {
              if let cap = controller.capability as? Capability<auth(FlowTransactionScheduler.Execute) &{FlowTransactionScheduler.TransactionHandler}> {
                handlerCap = cap
                break
              }
            }
          }
          handlerCap = handlerCap ?? panic("Handler not initialized")

          let managerOwnerCap = signer.capabilities.storage.issue<auth(FlowTransactionSchedulerUtils.Owner) &{FlowTransactionSchedulerUtils.Manager}>(
            FlowTransactionSchedulerUtils.managerStoragePath
          )

          let flowTokenVaultCap = signer.capabilities.storage.issue<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            /storage/flowTokenVault
          )

          let ruleBook = signer.storage.borrow<&AutomationRulesV2.RuleBook>(from: AutomationRulesV2.RuleBookStoragePath)
            ?? panic("Could not borrow rule book")

          let rule = AutomationRulesV2.Rule(
            actionType: actionType,
            amount: amount,
            intervalSeconds: intervalSeconds,
            schedulerId: nil
          )
          let ruleIndex = ruleBook.addRule(rule: rule)

          let ruleBookCap = signer.capabilities.storage.issue<&{AutomationRulesV2.RuleBookPublic}>(
            AutomationRulesV2.RuleBookStoragePath
          )

          // Create save data and schedule
          let saveData = VaultSaveHandlerV2.SaveData(
            owner: signer.address,
            ruleIndex: ruleIndex,
            amount: amount,
            intervalSeconds: intervalSeconds,
            ruleBookCap: ruleBookCap,
            managerOwnerCap: managerOwnerCap,
            flowTokenVaultCap: flowTokenVaultCap
          )

          let dataSizeMB = FlowTransactionScheduler.getSizeOfData(saveData)
          let estimatedFee = FlowTransactionScheduler.calculateFee(
            executionEffort: executionEffort,
            priority: priority,
            dataSizeMB: dataSizeMB
          )
          let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow FlowToken vault")
          let fees <- vaultRef.withdraw(amount: estimatedFee) as! @FlowToken.Vault
          let manager = signer.storage.borrow<auth(FlowTransactionSchedulerUtils.Owner) &{FlowTransactionSchedulerUtils.Manager}>(
            from: FlowTransactionSchedulerUtils.managerStoragePath
          ) ?? panic("Manager not initialized")
          
          let schedulerId = manager.schedule(
            handlerCap: handlerCap!,
            data: saveData,
            timestamp: getCurrentBlock().timestamp + intervalSeconds,
            priority: priority,
            executionEffort: executionEffort,
            fees: <-fees
          )

          // ═══ STEP 5: Persist initial scheduler ID ═══
          ruleBook.setSchedulerId(index: ruleIndex, schedulerId: schedulerId)
        }
      }
    `,
    args: (arg: any, t: any) => [
      arg(actionType, t.String),
      arg(amount.toFixed(8), t.UFix64),
      arg(intervalSeconds.toFixed(1), t.UFix64),
    ],
    proposer: authz,
    payer: authz,
    authorizations: [authz],
    limit: 999,
  });

  await fcl.tx(txId).onceSealed();
  console.log("[createAutomationRule] ✅ Scheduled! Flow network will now handle recurring deposits. TX:", txId);

  return txId;
}

export async function getUserRules(address: string): Promise<any[]> {
  try {
    console.log("[getUserRules] Fetching rules for address:", address);
    const result = await fcl.query({
      cadence: `
        import AutomationRulesV2 from ${VAULT_CONTRACT}

        access(all) struct RuleView {
          access(all) let index: Int
          access(all) let actionType: String
          access(all) let amount: UFix64
          access(all) let intervalSeconds: UFix64
          access(all) let active: Bool
          access(all) let schedulerId: UInt64?

          init(index: Int, actionType: String, amount: UFix64, intervalSeconds: UFix64, active: Bool, schedulerId: UInt64?) {
            self.index = index
            self.actionType = actionType
            self.amount = amount
            self.intervalSeconds = intervalSeconds
            self.active = active
            self.schedulerId = schedulerId
          }
        }

        access(all) fun main(address: Address): [RuleView] {
          let account = getAccount(address)
          let ruleBook = account.capabilities.borrow<&{AutomationRulesV2.RuleBookPublic}>(AutomationRulesV2.RuleBookPublicPath)
          if ruleBook == nil {
            log("No RuleBook V2 found for address")
            return []
          }

          let rules = ruleBook!.getRules()
          log("Found rules count:")
          log(rules.length)
          var views: [RuleView] = []
          var i = 0
          while i < rules.length {
            let rule = rules[i]
            views.append(
              RuleView(
                index: i,
                actionType: rule.actionType,
                amount: rule.amount,
                intervalSeconds: rule.intervalSeconds,
                active: rule.active,
                schedulerId: rule.schedulerId
              )
            )
            i = i + 1
          }

          return views
        }
      `,
      args: (arg: any, t: any) => [arg(address, t.Address)],
    });

    console.log("[getUserRules] Query result:", result);

    if (!Array.isArray(result)) {
      console.log("[getUserRules] Result is not an array, returning empty");
      return [];
    }

    const mapped = result.map((rule: any, fallbackIndex: number) => ({
      index: Number.isInteger(rule?.index) ? rule.index : fallbackIndex,
      actionType: String(rule?.actionType ?? "SCHEDULED_SAVE"),
      amount: Number(rule?.amount ?? 0),
      intervalSeconds: Number(rule?.intervalSeconds ?? 0),
      active: Boolean(rule?.active),
      schedulerId: rule?.schedulerId != null ? String(rule.schedulerId) : null,
    }));

    console.log("[getUserRules] Mapped rules:", mapped);
    return mapped;
  } catch (error) {
    console.error("[getUserRules] Error:", error);
    return [];
  }
}

/**
 * Deactivate an automation rule and cancel its scheduled execution
 * Returns ~50% of unused fees to the user
 */
export async function deactivateRule(ruleIndex: number, userAddress?: string, _schedulerId?: string | null) {
  console.log("[deactivateRule] Canceling rule at index:", ruleIndex);
  const authz = (fcl as any).authz;

  if (userAddress) {
    console.log("[deactivateRule] Requesting sponsorship for", userAddress);
    await requestSponsorship(userAddress);
  }

  try {
    const txId = await fcl.mutate({
      cadence: `
      import AutomationRulesV2 from ${VAULT_CONTRACT}
      import FlowTransactionSchedulerUtils from 0x8c5303eaa26202d6
      import FlowToken from 0x7e60df042a9c0868
      
      transaction(ruleIndex: Int) {
        prepare(signer: auth(BorrowValue, Storage) &Account) {
          // Get rule book safely (avoid typed-borrow mismatch panic)
          var ruleBook: &AutomationRulesV2.RuleBook? = nil
          if signer.storage.borrow<&AnyResource>(from: AutomationRulesV2.RuleBookStoragePath) != nil {
            let existing <- signer.storage.load<@AnyResource>(from: AutomationRulesV2.RuleBookStoragePath)
              ?? panic("Could not load rule book")
            if let rb <- existing as? @AutomationRulesV2.RuleBook {
              signer.storage.save(<-rb, to: AutomationRulesV2.RuleBookStoragePath)
              ruleBook = signer.storage.borrow<&AutomationRulesV2.RuleBook>(from: AutomationRulesV2.RuleBookStoragePath)
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
          let cancelSchedulerId = rules[ruleIndex].schedulerId!
          
          // Mark rule as inactive
          validRuleBook.deactivateRule(index: ruleIndex)
          
          // Cancel the scheduled transaction
          let manager = signer.storage.borrow<auth(FlowTransactionSchedulerUtils.Owner) &{FlowTransactionSchedulerUtils.Manager}>(
            from: FlowTransactionSchedulerUtils.managerStoragePath
          ) ?? panic("Could not borrow scheduler manager")
          
          // Get vault for refund
          let vault = signer.storage.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow FlowToken vault")
          
          // Cancel and receive ~50% refund
          let refund <- manager.cancel(id: cancelSchedulerId)
          vault.deposit(from: <-refund)
        }
      }
    `,
      args: (arg: any, t: any) => [arg(ruleIndex, t.Int)],
      proposer: authz,
      payer: authz,
      authorizations: [authz],
      limit: 999,
    });

    await fcl.tx(txId).onceSealed();
    console.log("[deactivateRule] ✅ Rule canceled and refund received. TX:", txId);
    return txId;
  } catch (error: any) {
    const message = String(error?.message || error || "");
    const missingId = message.includes("not found in manager") || message.includes("Invalid ID");
    if (!missingId) {
      throw error;
    }

    console.warn("[deactivateRule] Scheduler ID not found in manager; falling back to local rule deactivation", {
      ruleIndex,
      reason: "scheduler-id-not-found",
    });

    const fallbackTxId = await fcl.mutate({
      cadence: `
        import AutomationRulesV2 from ${VAULT_CONTRACT}

        transaction(ruleIndex: Int) {
          prepare(signer: auth(BorrowValue, Storage) &Account) {
            let ruleBook = signer.storage.borrow<&AutomationRulesV2.RuleBook>(from: AutomationRulesV2.RuleBookStoragePath)
              ?? panic("Could not borrow rule book")
            ruleBook.deactivateRule(index: ruleIndex)
          }
        }
      `,
      args: (arg: any, t: any) => [arg(ruleIndex, t.Int)],
      proposer: authz,
      payer: authz,
      authorizations: [authz],
      limit: 999,
    });

    await fcl.tx(fallbackTxId).onceSealed();
    console.log("[deactivateRule] ⚠️ Rule marked inactive without scheduler refund. TX:", fallbackTxId);
    return fallbackTxId;
  }
}
