/**
 * Error thrown when a registered policy rejects an operation.
 */
export class PolicyViolationError extends Error {
    /**
     * @param {string} policyName
     * @param {string} method
     * @param {Object} target - { wallet?, protocol?: { blockchain?, label? } }
     */
    constructor(policyName: string, method: string, target?: any);
    /** @type {string} */
    policy: string;
    /** @type {string} */
    method: string;
    /** @type {Object} */
    target: any;
}
