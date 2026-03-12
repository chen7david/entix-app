import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BucketService, type BucketConfig } from '@api/services/bucket.service';

describe('BucketService', () => {
    const config: BucketConfig = {
        accountId: 'test-account-id',
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
        bucketName: 'test-bucket',
        publicUrl: 'https://assets.test.com',
    };

    let service: BucketService;
    let fetchSpy: import('vitest').MockInstance;

    beforeEach(() => {
        service = new BucketService(config);

        // Mock global fetch globally for the AwsClient internal calls
        fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (_input, _init) => {
            return new Response('Mock response', { status: 200, statusText: 'OK' });
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('upload', () => {
        it('should format requests correctly and construct standard Cloudinary-style response', async () => {
            const data = 'test file content';
            const options = {
                folder: 'avatars',
                fileName: 'user123.png',
                contentType: 'image/png'
            };

            const result = await service.upload(data, options);

            // Assert fetch was called with correct URL
            expect(fetchSpy).toHaveBeenCalledTimes(1);
            const callArgs = fetchSpy.mock.calls[0];

            // AWS4Fetch wraps the Request object, so we verify the request details
            const requestObj = callArgs[0] as Request;
            expect(requestObj.url).toBe('https://test-account-id.r2.cloudflarestorage.com/test-bucket/avatars/user123.png');
            expect(requestObj.method).toBe('PUT');

            // Verify content type was preserved in headers
            expect(requestObj.headers.get('content-type')).toBe('image/png');

            // Assert return format matches UploadResponse standard
            expect(result.public_id).toBe('avatars/user123.png');
            expect(result.secure_url).toBe('https://assets.test.com/avatars/user123.png');
            expect(result.format).toBe('png');
            expect(result.asset_id).toBeDefined();
            expect(result.created_at).toBeDefined();
        });

        it('should throw an error if the upload fails', async () => {
            fetchSpy.mockResolvedValueOnce(new Response('Forbidden', { status: 403, statusText: 'Forbidden' }));

            await expect(service.upload('data')).rejects.toThrow(/R2 Upload Error: Forbidden/);
        });
    });

    describe('delete', () => {
        it('should send a DELETE request for a given key', async () => {
            const key = 'avatars/user123.png';
            const success = await service.delete(key);

            expect(success).toBe(true);
            expect(fetchSpy).toHaveBeenCalledTimes(1);

            const requestObj = fetchSpy.mock.calls[0][0] as Request;
            expect(requestObj.url).toBe('https://test-account-id.r2.cloudflarestorage.com/test-bucket/avatars/user123.png');
            expect(requestObj.method).toBe('DELETE');
        });
    });

    describe('getPresignedUploadUrl', () => {
        it('should generate a signed PUT url using aws4fetch', async () => {
            // AwsClient.sign configured with signQuery: true will inject auth directly into the URL query parameters
            const signedUrl = await service.getPresignedUploadUrl('raw/data.csv', 3600);

            expect(signedUrl).toContain('https://test-account-id.r2.cloudflarestorage.com/test-bucket/raw/data.csv');
            expect(signedUrl).toContain('X-Amz-Expires=3600');
            expect(signedUrl).toContain('X-Amz-Algorithm=AWS4-HMAC-SHA256');
            expect(signedUrl).toContain('X-Amz-Credential=test-access-key');
            expect(signedUrl).toContain('X-Amz-Signature=');
        });
    });
});
