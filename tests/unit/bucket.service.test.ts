import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BucketService, type BucketConfig } from '@api/services/bucket.service';
import { AwsClient } from 'aws4fetch';

// Mock the entire aws4fetch module
vi.mock('aws4fetch', () => {
    return {
        AwsClient: vi.fn().mockImplementation(() => ({
            fetch: vi.fn(),
            sign: vi.fn()
        }))
    };
});

describe('BucketService', () => {
    const config: BucketConfig = {
        accountId: 'test-account-id',
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
        bucketName: 'test-bucket',
        publicUrl: 'https://assets.test.com',
    };

    let service: BucketService;
    let mockClient: any;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new BucketService(config);
        // @ts-ignore - access private client for testing
        mockClient = service.client;
        
        // Default sign implementation
        mockClient.sign.mockImplementation(async (url: string) => ({ url }));
    });

    describe('upload', () => {
        it('should format requests correctly and construct standard Cloudinary-style response', async () => {
            const data = 'test file content';
            const options = {
                folder: 'avatars',
                fileName: 'user123.png',
                contentType: 'image/png'
            };

            mockClient.fetch.mockResolvedValue(new Response('Mock response', { status: 200, statusText: 'OK' }));

            const result = await service.upload(data, options);

            expect(mockClient.fetch).toHaveBeenCalledTimes(1);
            const [url, init] = mockClient.fetch.mock.calls[0];

            expect(url).toBe('https://test-account-id.r2.cloudflarestorage.com/test-bucket/avatars/user123.png');
            expect(init.method).toBe('PUT');
            expect(init.headers['Content-Type']).toBe('image/png');

            expect(result.public_id).toBe('avatars/user123.png');
            expect(result.secure_url).toBe('https://assets.test.com/avatars/user123.png');
        });

        it('should throw an error if the upload fails', async () => {
            mockClient.fetch.mockResolvedValue(new Response('Forbidden', { status: 403, statusText: 'Forbidden' }));

            await expect(service.upload('data')).rejects.toThrow(/R2 Upload Error: Forbidden/);
        });
    });

    describe('delete', () => {
        it('should send a DELETE request for a given key', async () => {
            mockClient.fetch.mockResolvedValue(new Response('Mock response', { status: 200, statusText: 'OK' }));
            const key = 'avatars/user123.png';
            await service.delete(key);

            expect(mockClient.fetch).toHaveBeenCalledTimes(1);
            const [url, init] = mockClient.fetch.mock.calls[0];

            expect(url).toBe('https://test-account-id.r2.cloudflarestorage.com/test-bucket/avatars/user123.png');
            expect(init.method).toBe('DELETE');
        });

        it('should succeed (return void) if R2 returns 404 Not Found', async () => {
            mockClient.fetch.mockResolvedValue(new Response('Not Found', { status: 404, statusText: 'Not Found' }));
            const key = 'missing.png';
            
            await expect(service.delete(key)).resolves.toBeUndefined();
            expect(mockClient.fetch).toHaveBeenCalledTimes(1);
        });

        it('should throw if R2 returns a critical error (e.g. 500)', async () => {
            mockClient.fetch.mockResolvedValue(new Response('Internal Error', { status: 500, statusText: 'Internal Server Error' }));
            const key = 'error.png';

            await expect(service.delete(key)).rejects.toThrow(/R2 Delete Error: Internal Server Error/);
        });
    });

    describe('getPresignedUploadUrl', () => {
        it('should generate a signed PUT url', async () => {
            mockClient.sign.mockResolvedValue({ 
                url: 'https://test-account-id.r2.cloudflarestorage.com/test-bucket/raw/data.csv?X-Amz-Signature=fake' 
            });
            
            const signedUrl = await service.getPresignedUploadUrl('raw/data.csv', 3600);

            expect(signedUrl).toContain('https://test-account-id.r2.cloudflarestorage.com/test-bucket/raw/data.csv');
            expect(signedUrl).toContain('X-Amz-Signature=fake');
        });
    });
});
