import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb, TestDb } from "../lib/utils";
import { media, user, organization } from "@shared/db/schema.db";
import { PlaylistRepository } from "@api/repositories/playlist.repository";
import { createMockUser } from "../factories/user.factory";

describe("PlaylistRepository DB Test", () => {
    let db: TestDb;
    let repo: PlaylistRepository;

    beforeEach(async () => {
        db = await createTestDb();
        repo = new PlaylistRepository(db as any);
    });

    it("should correctly batch update and save media sequence via Drizzle", async () => {
        // 1. Setup Prerequisite Data
        const mockOrgId = "org_123";
        const mockUserId = "user_123";

        const testUser = createMockUser({ id: mockUserId });
        await db.insert(user).values(testUser);
        await db.insert(organization).values({ id: mockOrgId, name: "Test Org", slug: "test-org", createdAt: new Date() });

        const newPlaylist = await repo.create({
            id: "playlist_123",
            organizationId: mockOrgId,
            title: "Test Playlist",
            createdBy: testUser.id,
        });

        const media1 = { id: "media_1", organizationId: mockOrgId, title: "Media 1", mimeType: "video/mp4", mediaUrl: "http", uploadedBy: testUser.id, createdAt: new Date(), updatedAt: new Date(), playCount: 0 };
        const media2 = { id: "media_2", organizationId: mockOrgId, title: "Media 2", mimeType: "video/mp4", mediaUrl: "http", uploadedBy: testUser.id, createdAt: new Date(), updatedAt: new Date(), playCount: 0 };
        
        await db.insert(media).values([media1, media2] as any);

        // 2. Initial Setup (Insert 2 items)
        await repo.setMediaSequence(newPlaylist.id, [media1.id, media2.id]);
        
        let sequence = await repo.getMediaSequence(newPlaylist.id);
        expect(sequence).toHaveLength(2);
        expect(sequence[0].mediaId).toBe("media_1");
        expect(sequence[0].position).toBe(0);
        expect(sequence[1].mediaId).toBe("media_2");
        expect(sequence[1].position).toBe(1);

        // 3. Batch re-order test (Swap elements)
        await repo.setMediaSequence(newPlaylist.id, [media2.id, media1.id]);
        
        sequence = await repo.getMediaSequence(newPlaylist.id);
        expect(sequence).toHaveLength(2);
        expect(sequence[0].mediaId).toBe("media_2"); // Verify Swapped
        expect(sequence[0].position).toBe(0);
        expect(sequence[1].mediaId).toBe("media_1");
        expect(sequence[1].position).toBe(1);

        // 4. Batch delete test (Remove an element)
        await repo.setMediaSequence(newPlaylist.id, [media1.id]);
        
        sequence = await repo.getMediaSequence(newPlaylist.id);
        expect(sequence).toHaveLength(1);
        expect(sequence[0].mediaId).toBe("media_1");
        expect(sequence[0].position).toBe(0);
        
        // 5. Empty clearance test
        await repo.setMediaSequence(newPlaylist.id, []);
        sequence = await repo.getMediaSequence(newPlaylist.id);
        expect(sequence).toHaveLength(0);
    });
});
