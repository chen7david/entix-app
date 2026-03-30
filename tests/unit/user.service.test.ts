import type { UserRepository } from "@api/repositories/user.repository";
import { UserService } from "@api/services/user.service";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockAuth, type MockAuth } from "../factories/auth.factory";

describe("UserService", () => {
    let service: UserService;
    let mockRepo: any;
    let mockAuth: MockAuth;

    beforeEach(() => {
        mockRepo = {
            findUserById: vi.fn(),
            findUserByEmail: vi.fn(),
            updateUser: vi.fn(),
            findUsersByOrganization: vi.fn(),
        };
        mockAuth = createMockAuth();
        service = new UserService(mockRepo as unknown as UserRepository, mockAuth as any);
    });

    describe("createUser", () => {
        const input = { email: "test@example.com", name: "Test", password: "pwd" };

        it("calls auth.api.signUpEmail and returns result", async () => {
            const expectedResult = {
                user: { id: "u_1", email: input.email, name: input.name, emailVerified: false },
            };
            mockAuth.api.signUpEmail.mockResolvedValue(expectedResult);

            const result = await service.createUser(input);

            expect(mockAuth.api.signUpEmail).toHaveBeenCalledWith({ body: input });
            expect(result).toEqual(expectedResult);
        });

        it("throws when auth call returns null", async () => {
            mockAuth.api.signUpEmail.mockResolvedValue(null);
            await expect(service.createUser(input)).rejects.toThrow(/User creation failed/);
        });

        it("propagates auth errors", async () => {
            mockAuth.api.signUpEmail.mockRejectedValue(new Error("Auth down"));
            await expect(service.createUser(input)).rejects.toThrow("Auth down");
        });
    });

    describe("sendPasswordResetEmail", () => {
        it("triggers password reset via auth api", async () => {
            await service.sendPasswordResetEmail("test@x.com", "/reset");
            expect(mockAuth.api.requestPasswordReset).toHaveBeenCalledWith({
                body: { email: "test@x.com", redirectTo: "/reset" },
            });
        });
    });

    describe("find vs get convention", () => {
        const mockUser = { id: "u_1", email: "test@x.com", name: "X" };

        it("findUserById returns record or null", async () => {
            mockRepo.findUserById.mockResolvedValue(mockUser);
            expect(await service.findUserById("u_1")).toEqual(mockUser);

            mockRepo.findUserById.mockResolvedValue(null);
            expect(await service.findUserById("ghost")).toBeNull();
        });

        it("getUserById returns record or throws", async () => {
            mockRepo.findUserById.mockResolvedValue(mockUser);
            expect(await service.getUserById("u_1")).toEqual(mockUser);

            mockRepo.findUserById.mockResolvedValue(null);
            await expect(service.getUserById("ghost")).rejects.toThrow(/not found/);
        });

        it("findUserByEmail returns record or null", async () => {
            mockRepo.findUserByEmail.mockResolvedValue(mockUser);
            expect(await service.findUserByEmail("test@x.com")).toEqual(mockUser);

            mockRepo.findUserByEmail.mockResolvedValue(null);
            expect(await service.findUserByEmail("missing@x.com")).toBeNull();
        });

        it("getUserByEmail returns record or throws", async () => {
            mockRepo.findUserByEmail.mockResolvedValue(mockUser);
            expect(await service.getUserByEmail("test@x.com")).toEqual(mockUser);

            mockRepo.findUserByEmail.mockResolvedValue(null);
            await expect(service.getUserByEmail("missing@x.com")).rejects.toThrow(/not found/);
        });
    });
});
