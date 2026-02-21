"use strict";

import { beforeEach, describe, expect, jest, test } from "@jest/globals";

import WalletManager from "@tetherto/wdk-wallet";

import {
  BridgeProtocol,
  LendingProtocol,
  SwapProtocol,
} from "@tetherto/wdk-wallet/protocols";

import WdkManager, { errors } from "../index.js";

const SEED_PHRASE =
  "cook voyage document eight skate token alien guide drink uncle term abuse";

const getAccountMock = jest.fn(),
  getAccountByPathMock = jest.fn(),
  getFeeRatesMock = jest.fn(),
  disposeMock = jest.fn();

const WalletManagerMock = jest.fn().mockImplementation((seed, config) => {
  return Object.create(WalletManager.prototype, {
    getAccount: {
      value: getAccountMock,
    },
    getAccountByPath: {
      value: getAccountByPathMock,
    },
    getFeeRates: {
      value: getFeeRatesMock,
    },
    dispose: {
      value: disposeMock,
    },
  });
});

describe("WdkManager", () => {
  const DUMMY_ACCOUNT = {
    getAddress: async () => {
      return "0xa460AEbce0d3A4BecAd8ccf9D6D4861296c503Bd";
    },
  };

  const CONFIG = { transferMaxFee: 100 };

  let wdkManager;

  beforeEach(() => {
    wdkManager = new WdkManager(SEED_PHRASE);
  });

  describe("getAccount", () => {
    beforeEach(() => {
      getAccountMock.mockResolvedValue(DUMMY_ACCOUNT);
    });

    test("should return the account at the given index", async () => {
      wdkManager.registerWallet("ethereum", WalletManagerMock, CONFIG);

      const account = await wdkManager.getAccount("ethereum", 0);

      expect(WalletManagerMock).toHaveBeenCalledWith(SEED_PHRASE, CONFIG);

      expect(getAccountMock).toHaveBeenCalledWith(0);

      expect(account).toEqual(DUMMY_ACCOUNT);
    });

    test("should trigger middlewares", async () => {
      const middleware = jest.fn();

      wdkManager
        .registerWallet("ethereum", WalletManagerMock, CONFIG)
        .registerMiddleware("ethereum", middleware);

      const account = await wdkManager.getAccount("ethereum", 0);

      expect(middleware).toHaveBeenCalledWith(DUMMY_ACCOUNT);

      expect(account).toEqual(DUMMY_ACCOUNT);
    });

    test("should throw if no wallet has been registered for the given blockchain", async () => {
      await expect(wdkManager.getAccount("ethereum", 0)).rejects.toThrow(
        "No wallet registered for blockchain: ethereum.",
      );
    });

    describe("should decorate the account instance with", () => {
      describe("getSwapProtocol", () => {
        const SWAP_CONFIG = { swapMaxFee: 100 };

        let SwapProtocolMock;

        beforeEach(() => {
          SwapProtocolMock = jest.fn();

          Object.setPrototypeOf(
            SwapProtocolMock.prototype,
            SwapProtocol.prototype,
          );
        });

        test("should return the swap protocol registered for the account's blockchain and the given label", async () => {
          wdkManager
            .registerWallet("ethereum", WalletManagerMock, CONFIG)
            .registerProtocol(
              "ethereum",
              "test",
              SwapProtocolMock,
              SWAP_CONFIG,
            );

          const account = await wdkManager.getAccount("ethereum", 0);

          const protocol = account.getSwapProtocol("test");

          expect(SwapProtocolMock).toHaveBeenCalledWith(account, SWAP_CONFIG);

          expect(protocol).toBeInstanceOf(SwapProtocolMock);
        });

        test("should return the swap protocol registered for the account and the given label", async () => {
          wdkManager.registerWallet("ethereum", WalletManagerMock, CONFIG);

          const account = await wdkManager.getAccount("ethereum", 0);

          account.registerProtocol("test", SwapProtocolMock, SWAP_CONFIG);

          const protocol = account.getSwapProtocol("test");

          expect(SwapProtocolMock).toHaveBeenCalledWith(account, SWAP_CONFIG);

          expect(protocol).toBeInstanceOf(SwapProtocolMock);
        });

        test("should throw if no swap protocol has been registered for the given label", async () => {
          wdkManager.registerWallet("ethereum", WalletManagerMock, CONFIG);

          const account = await wdkManager.getAccount("ethereum", 0);

          expect(() => account.getSwapProtocol("test")).toThrow(
            "No swap protocol registered for label: test.",
          );
        });
      });

      describe("getBridgeProtocol", () => {
        const BRIDGE_CONFIG = { bridgeMaxFee: 100 };

        let BridgeProtocolMock;

        beforeEach(() => {
          BridgeProtocolMock = jest.fn();

          Object.setPrototypeOf(
            BridgeProtocolMock.prototype,
            BridgeProtocol.prototype,
          );
        });

        test("should return the bridge protocol registered for the account's blockchain and the given label", async () => {
          wdkManager
            .registerWallet("ethereum", WalletManagerMock, CONFIG)
            .registerProtocol(
              "ethereum",
              "test",
              BridgeProtocolMock,
              BRIDGE_CONFIG,
            );

          const account = await wdkManager.getAccount("ethereum", 0);

          const protocol = account.getBridgeProtocol("test");

          expect(BridgeProtocolMock).toHaveBeenCalledWith(
            account,
            BRIDGE_CONFIG,
          );

          expect(protocol).toBeInstanceOf(BridgeProtocolMock);
        });

        test("should return the bridge protocol registered for the account and the given label", async () => {
          wdkManager.registerWallet("ethereum", WalletManagerMock, CONFIG);

          const account = await wdkManager.getAccount("ethereum", 0);

          account.registerProtocol("test", BridgeProtocolMock, BRIDGE_CONFIG);

          const protocol = account.getBridgeProtocol("test");

          expect(BridgeProtocolMock).toHaveBeenCalledWith(
            account,
            BRIDGE_CONFIG,
          );

          expect(protocol).toBeInstanceOf(BridgeProtocolMock);
        });

        test("should throw if no bridge protocol has been registered for the given label", async () => {
          wdkManager.registerWallet("ethereum", WalletManagerMock, CONFIG);

          const account = await wdkManager.getAccount("ethereum", 0);

          expect(() => account.getBridgeProtocol("test")).toThrow(
            "No bridge protocol registered for label: test.",
          );
        });
      });

      describe("getLendingProtocol", () => {
        let LendingProtocolMock;

        beforeEach(() => {
          LendingProtocolMock = jest.fn();

          Object.setPrototypeOf(
            LendingProtocolMock.prototype,
            LendingProtocol.prototype,
          );
        });

        test("should return the lending protocol registered for the account's blockchain and the given label", async () => {
          wdkManager
            .registerWallet("ethereum", WalletManagerMock, CONFIG)
            .registerProtocol(
              "ethereum",
              "test",
              LendingProtocolMock,
              undefined,
            );

          const account = await wdkManager.getAccount("ethereum", 0);

          const protocol = account.getLendingProtocol("test");

          expect(LendingProtocolMock).toHaveBeenCalledWith(account, undefined);

          expect(protocol).toBeInstanceOf(LendingProtocolMock);
        });

        test("should return the lending protocol registered for the account and the given label", async () => {
          wdkManager.registerWallet("ethereum", WalletManagerMock, CONFIG);

          const account = await wdkManager.getAccount("ethereum", 0);

          account.registerProtocol("test", LendingProtocolMock, undefined);

          const protocol = account.getLendingProtocol("test");

          expect(LendingProtocolMock).toHaveBeenCalledWith(account, undefined);

          expect(protocol).toBeInstanceOf(LendingProtocolMock);
        });

        test("should throw if no lending protocol has been registered for the given label", async () => {
          wdkManager.registerWallet("ethereum", WalletManagerMock, CONFIG);

          const account = await wdkManager.getAccount("ethereum", 0);

          expect(() => account.getLendingProtocol("test")).toThrow(
            "No lending protocol registered for label: test.",
          );
        });
      });
    });
  });

  describe("getAccountByPath", () => {
    beforeEach(() => {
      getAccountByPathMock.mockResolvedValue(DUMMY_ACCOUNT);
    });

    test("should return the account at the given path", async () => {
      wdkManager.registerWallet("ethereum", WalletManagerMock, CONFIG);

      const account = await wdkManager.getAccountByPath("ethereum", "0'/0/0");

      expect(WalletManagerMock).toHaveBeenCalledWith(SEED_PHRASE, CONFIG);

      expect(getAccountByPathMock).toHaveBeenCalledWith("0'/0/0");

      expect(account).toEqual(DUMMY_ACCOUNT);
    });

    test("should trigger middlewares", async () => {
      const middleware = jest.fn();

      wdkManager
        .registerWallet("ethereum", WalletManagerMock, CONFIG)
        .registerMiddleware("ethereum", middleware);

      const account = await wdkManager.getAccountByPath("ethereum", "0'/0/0");

      expect(middleware).toHaveBeenCalledWith(DUMMY_ACCOUNT);

      expect(account).toEqual(DUMMY_ACCOUNT);
    });

    test("should throw if no wallet has been registered for the given blockchain", async () => {
      await expect(
        wdkManager.getAccountByPath("ethereum", "0'/0/0"),
      ).rejects.toThrow("No wallet registered for blockchain: ethereum.");
    });

    describe("should decorate the account instance with", () => {
      describe("getSwapProtocol", () => {
        const SWAP_CONFIG = { swapMaxFee: 100 };

        let SwapProtocolMock;

        beforeEach(() => {
          SwapProtocolMock = jest.fn();

          Object.setPrototypeOf(
            SwapProtocolMock.prototype,
            SwapProtocol.prototype,
          );
        });

        test("should return the swap protocol registered for the account's blockchain and the given label", async () => {
          wdkManager
            .registerWallet("ethereum", WalletManagerMock, CONFIG)
            .registerProtocol(
              "ethereum",
              "test",
              SwapProtocolMock,
              SWAP_CONFIG,
            );

          const account = await wdkManager.getAccountByPath(
            "ethereum",
            "0'/0/0",
          );

          const protocol = account.getSwapProtocol("test");

          expect(SwapProtocolMock).toHaveBeenCalledWith(account, SWAP_CONFIG);

          expect(protocol).toBeInstanceOf(SwapProtocolMock);
        });

        test("should return the swap protocol registered for the account and the given label", async () => {
          wdkManager.registerWallet("ethereum", WalletManagerMock, CONFIG);

          const account = await wdkManager.getAccountByPath(
            "ethereum",
            "0'/0/0",
          );

          account.registerProtocol("test", SwapProtocolMock, SWAP_CONFIG);

          const protocol = account.getSwapProtocol("test");

          expect(SwapProtocolMock).toHaveBeenCalledWith(account, SWAP_CONFIG);

          expect(protocol).toBeInstanceOf(SwapProtocolMock);
        });

        test("should throw if no swap protocol has been registered for the given label", async () => {
          wdkManager.registerWallet("ethereum", WalletManagerMock, CONFIG);

          const account = await wdkManager.getAccountByPath(
            "ethereum",
            "0'/0/0",
          );

          expect(() => account.getSwapProtocol("test")).toThrow(
            "No swap protocol registered for label: test.",
          );
        });
      });

      describe("getBridgeProtocol", () => {
        const BRIDGE_CONFIG = { bridgeMaxFee: 100 };

        let BridgeProtocolMock;

        beforeEach(() => {
          BridgeProtocolMock = jest.fn();

          Object.setPrototypeOf(
            BridgeProtocolMock.prototype,
            BridgeProtocol.prototype,
          );
        });

        test("should return the bridge protocol registered for the account's blockchain and the given label", async () => {
          wdkManager
            .registerWallet("ethereum", WalletManagerMock, CONFIG)
            .registerProtocol(
              "ethereum",
              "test",
              BridgeProtocolMock,
              BRIDGE_CONFIG,
            );

          const account = await wdkManager.getAccountByPath(
            "ethereum",
            "0'/0/0",
          );

          const protocol = account.getBridgeProtocol("test");

          expect(BridgeProtocolMock).toHaveBeenCalledWith(
            account,
            BRIDGE_CONFIG,
          );

          expect(protocol).toBeInstanceOf(BridgeProtocolMock);
        });

        test("should return the bridge protocol registered for the account and the given label", async () => {
          wdkManager.registerWallet("ethereum", WalletManagerMock, CONFIG);

          const account = await wdkManager.getAccountByPath(
            "ethereum",
            "0'/0/0",
          );

          account.registerProtocol("test", BridgeProtocolMock, BRIDGE_CONFIG);

          const protocol = account.getBridgeProtocol("test");

          expect(BridgeProtocolMock).toHaveBeenCalledWith(
            account,
            BRIDGE_CONFIG,
          );

          expect(protocol).toBeInstanceOf(BridgeProtocolMock);
        });

        test("should throw if no bridge protocol has been registered for the given label", async () => {
          wdkManager.registerWallet("ethereum", WalletManagerMock, CONFIG);

          const account = await wdkManager.getAccountByPath(
            "ethereum",
            "0'/0/0",
          );

          expect(() => account.getBridgeProtocol("test")).toThrow(
            "No bridge protocol registered for label: test.",
          );
        });
      });

      describe("getLendingProtocol", () => {
        let LendingProtocolMock;

        beforeEach(() => {
          LendingProtocolMock = jest.fn();

          Object.setPrototypeOf(
            LendingProtocolMock.prototype,
            LendingProtocol.prototype,
          );
        });

        test("should return the lending protocol registered for the account's blockchain and the given label", async () => {
          wdkManager
            .registerWallet("ethereum", WalletManagerMock, CONFIG)
            .registerProtocol(
              "ethereum",
              "test",
              LendingProtocolMock,
              undefined,
            );

          const account = await wdkManager.getAccountByPath(
            "ethereum",
            "0'/0/0",
          );

          const protocol = account.getLendingProtocol("test");

          expect(LendingProtocolMock).toHaveBeenCalledWith(account, undefined);

          expect(protocol).toBeInstanceOf(LendingProtocolMock);
        });

        test("should return the lending protocol registered for the account and the given label", async () => {
          wdkManager.registerWallet("ethereum", WalletManagerMock, CONFIG);

          const account = await wdkManager.getAccountByPath(
            "ethereum",
            "0'/0/0",
          );

          account.registerProtocol("test", LendingProtocolMock, undefined);

          const protocol = account.getLendingProtocol("test");

          expect(LendingProtocolMock).toHaveBeenCalledWith(account, undefined);

          expect(protocol).toBeInstanceOf(LendingProtocolMock);
        });

        test("should throw if no lending protocol has been registered for the given label", async () => {
          wdkManager.registerWallet("ethereum", WalletManagerMock, CONFIG);

          const account = await wdkManager.getAccountByPath(
            "ethereum",
            "0'/0/0",
          );

          expect(() => account.getLendingProtocol("test")).toThrow(
            "No lending protocol registered for label: test.",
          );
        });
      });
    });
  });

  describe("getFeeRates", () => {
    test("should return the correct fee rates for the given blockchain", async () => {
      const DUMMY_FEE_RATES = { normal: 100n, fast: 200n };

      getFeeRatesMock.mockResolvedValue(DUMMY_FEE_RATES);

      wdkManager.registerWallet("ethereum", WalletManagerMock, CONFIG);

      const feeRates = await wdkManager.getFeeRates("ethereum");

      expect(feeRates).toEqual(DUMMY_FEE_RATES);
    });

    test("should throw if no wallet has been registered for the given blockchain", async () => {
      await expect(wdkManager.getFeeRates("ethereum")).rejects.toThrow(
        "No wallet registered for blockchain: ethereum.",
      );
    });
  });

  describe("dispose", () => {
    test("should successfully dispose the wallet managers", async () => {
      wdkManager.registerWallet("ethereum", WalletManagerMock, CONFIG);

      wdkManager.dispose();

      expect(disposeMock).toHaveBeenCalled();
    });
  });

  describe("registerPolicies", () => {
    const CONFIG = { transferMaxFee: 100 };

    const createDummyAccount = () => ({
      getAddress: async () => {
        return "0xa460AEbce0d3A4BecAd8ccf9D6D4861296c503Bd";
      },
      sendTransaction: jest.fn(async (params) => ({ type: "send", params })),
      transfer: jest.fn(async (params) => ({ type: "transfer", params })),
      bridge: jest.fn(async (params) => ({ type: "bridge", params })),
      stake: jest.fn(async (params) => ({ type: "stake", params })),
      unstake: jest.fn(async (params) => ({ type: "unstake", params })),
      sign: jest.fn(async (params) => ({ type: "sign", params })),
      nonMutating: jest.fn(() => "readonly"),
    });

    beforeEach(() => {
      getAccountMock.mockReset();
      getAccountMock.mockImplementation(createDummyAccount);
    });

    test("global spending limit policy rejects oversized sendTransaction", async () => {
      wdkManager.registerWallet("ethereum", WalletManagerMock, CONFIG);

      wdkManager.registerPolicies([
        {
          name: "max-transfer-1eth",
          evaluate({ method, params }) {
            if (method !== "sendTransaction") return true;
            return BigInt(params.value ?? 0) <= 10n ** 18n;
          },
        },
      ]);

      const account = await wdkManager.getAccount("ethereum", 0);

      await expect(() =>
        account.sendTransaction({ value: 2n * 10n ** 18n }),
      ).rejects.toBeInstanceOf(errors.PolicyViolationError);

      const ok = await account.sendTransaction({ value: 5n * 10n ** 17n });
      expect(ok.type).toBe("send");
    });

    test("wallet-specific policy only applies to matching wallet", async () => {
      wdkManager.registerWallet("ethereum-test", WalletManagerMock, CONFIG);
      wdkManager.registerWallet("ton", WalletManagerMock, CONFIG);

      wdkManager.registerPolicies([
        {
          name: "ethereum-only-bridge",
          target: { wallet: "ethereum-test" },
          method: "bridge",
          evaluate: () => false,
        },
      ]);

      const ethAccount = await wdkManager.getAccount("ethereum-test", 0);
      const tonAccount = await wdkManager.getAccount("ton", 0);

      await expect(() => ethAccount.bridge({})).rejects.toBeInstanceOf(
        errors.PolicyViolationError,
      );

      const ok = await tonAccount.bridge({});
      expect(ok.type).toBe("bridge");
    });

    describe("protocol-targeted policy", () => {
      let SwapProtocolMock, BridgeProtocolMock, LendingProtocolMock;
      const SWAP_CONFIG = { swapMaxFee: 100 };
      const BRIDGE_CONFIG = { bridgeMaxFee: 100 };

      beforeEach(() => {
        SwapProtocolMock = jest.fn();
        Object.setPrototypeOf(
          SwapProtocolMock.prototype,
          SwapProtocol.prototype,
        );

        BridgeProtocolMock = jest.fn();
        Object.setPrototypeOf(
          BridgeProtocolMock.prototype,
          BridgeProtocol.prototype,
        );

        LendingProtocolMock = jest.fn();
        Object.setPrototypeOf(
          LendingProtocolMock.prototype,
          LendingProtocol.prototype,
        );
      });

      test("applies only to matching protocol target", async () => {
        wdkManager.registerWallet("ethereum", WalletManagerMock, CONFIG);
        wdkManager.registerProtocol(
          "ethereum",
          "mainnet",
          SwapProtocolMock,
          SWAP_CONFIG,
        );

        wdkManager.registerPolicies([
          {
            name: "swap-max-fee",
            target: { protocol: { blockchain: "ethereum", label: "mainnet" } },
            method: "swap",
            evaluate: () => false,
          },
        ]);

        const account = await wdkManager.getAccount("ethereum", 0);
        const protocol = account.getSwapProtocol("mainnet");

        await expect(() => protocol.swap({})).rejects.toBeInstanceOf(
          errors.PolicyViolationError,
        );
      });
    });

    test("policy with multiple methods applies to all listed methods", async () => {
      wdkManager.registerWallet("ethereum-local", WalletManagerMock, CONFIG);

      wdkManager.registerPolicies([
        {
          name: "disable-critical-ops",
          target: {
            wallet: "ethereum-local",
          },
          method: ["bridge", "stake", "unstake"],
          evaluate: () => false,
        },
      ]);

      const account = await wdkManager.getAccount("ethereum-local", 0);

      await expect(() => account.bridge({})).rejects.toBeInstanceOf(
        errors.PolicyViolationError,
      );
      await expect(() => account.stake({})).rejects.toBeInstanceOf(
        errors.PolicyViolationError,
      );
      await expect(() => account.unstake({})).rejects.toBeInstanceOf(
        errors.PolicyViolationError,
      );

      const ok = await account.sign({});
      expect(ok.type).toBe("sign");
    });

    test("async policy evaluates correctly", async () => {
      wdkManager.registerWallet("ethereum", WalletManagerMock, CONFIG);

      const hour = new Date().getUTCHours();
      wdkManager.registerPolicies([
        {
          name: "business-hours",
          async evaluate() {
            return hour >= 0;
          },
        },
      ]);

      const account = await wdkManager.getAccount("ethereum", 0);

      const result = await account.sign({});
      expect(result.type).toBe("sign");
    });

    test("recipient whitelist blocks non-whitelisted addresses", async () => {
      wdkManager.registerWallet("ethereum", WalletManagerMock, CONFIG);

      const allowed = new Set(["0xabc...", "0xdef..."]);
      wdkManager.registerPolicies([
        {
          name: "recipient-whitelist",
          method: "sendTransaction",
          evaluate({ method, params }) {
            if (!params?.to) return true;
            return allowed.has(params.to.toLowerCase());
          },
        },
      ]);

      const account = await wdkManager.getAccount("ethereum", 0);

      await expect(() =>
        account.sendTransaction({ to: "0x123..." }),
      ).rejects.toBeInstanceOf(errors.PolicyViolationError);

      const ok = await account.sendTransaction({ to: "0xabc..." });
      expect(ok.type).toBe("send");
    });

    test("stops at first rejecting policy", async () => {
      wdkManager.registerWallet("polygon", WalletManagerMock, CONFIG);

      const calls = [];
      wdkManager.registerPolicies([
        {
          name: "p1",
          method: "sendTransaction",
          evaluate: () => {
            calls.push("p1");
            return false;
          },
        },
        {
          name: "p2",
          method: "sendTransaction",
          evaluate: () => {
            calls.push("p2");
            return true;
          },
        },
      ]);

      const account = await wdkManager.getAccount("polygon", 0);

      await expect(() => account.sendTransaction({})).rejects.toBeInstanceOf(
        errors.PolicyViolationError,
      );
      expect(calls).toEqual(["p1"]);
    });

    test("global policy runs on all mutating methods if method not specified", async () => {
      wdkManager.registerWallet("ethereum", WalletManagerMock, CONFIG);

      const calls = [];
      wdkManager.registerPolicies([
        {
          name: "global-policy",
          evaluate: ({ method }) => {
            calls.push(method);
            return true;
          },
        },
      ]);

      const account = await wdkManager.getAccount("ethereum", 0);

      await account.transfer({});
      await account.stake({});
      await account.unstake({});

      expect(calls).toEqual(["transfer", "stake", "unstake"]);
    });

    test("non-mutating methods are not wrapped", async () => {
      wdkManager.registerWallet("ethereum", WalletManagerMock, CONFIG);

      wdkManager.registerPolicies([
        {
          name: "block-all",
          evaluate: () => false,
        },
      ]);

      const account = await wdkManager.getAccount("ethereum", 0);

      const result = account.nonMutating();
      expect(result).toBe("readonly");
    });
  });
});
