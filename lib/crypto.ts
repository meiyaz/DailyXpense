import * as Crypto from 'expo-crypto';

/**
 * Hashes a PIN using SHA-256.
 * @param pin The 4-digit PIN to hash.
 * @returns The hashed string.
 */
export const hashPin = async (pin: string): Promise<string> => {
    const digest = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        pin
    );
    return digest;
};
