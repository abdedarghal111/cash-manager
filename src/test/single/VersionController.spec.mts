import { VersionController } from "@single/VersionController.server.mjs"

type VersionTuple = [number, number, number]

describe("VersionController tests", () => {
    describe("isVesionBetween", () => {
        it("should return true when version equals target and greater than current", () => {
            const version: VersionTuple = [2, 0, 0]
            const target: VersionTuple = [2, 0, 0]
            const current: VersionTuple = [1, 0, 0]
            expect(VersionController.isVesionBetween(version, target, current)).toBe(true)
        })

        it("should return false when version equals current (must be greater than current)", () => {
            const version: VersionTuple = [1, 0, 0]
            const target: VersionTuple = [2, 0, 0]
            const current: VersionTuple = [1, 0, 0]
            expect(VersionController.isVesionBetween(version, target, current)).toBe(false)
        })

        it("should return false when version less than current", () => {
            const version: VersionTuple = [0, 9, 0]
            const target: VersionTuple = [2, 0, 0]
            const current: VersionTuple = [1, 0, 0]
            expect(VersionController.isVesionBetween(version, target, current)).toBe(false)
        })

        it("should return false when version greater than target", () => {
            const version: VersionTuple = [3, 0, 0]
            const target: VersionTuple = [2, 0, 0]
            const current: VersionTuple = [1, 0, 0]
            expect(VersionController.isVesionBetween(version, target, current)).toBe(false)
        })

        it("should return true when version between current and target (exclusive)", () => {
            const version: VersionTuple = [1, 5, 0]
            const target: VersionTuple = [2, 0, 0]
            const current: VersionTuple = [1, 0, 0]
            expect(VersionController.isVesionBetween(version, target, current)).toBe(true)
        })

        it("should handle multi-digit version numbers", () => {
            const version: VersionTuple = [123, 456, 789]
            const target: VersionTuple = [200, 0, 0]
            const current: VersionTuple = [100, 0, 0]
            expect(VersionController.isVesionBetween(version, target, current)).toBe(true)
        })

        it("should return true when version between but equal to target (edge case)", () => {
            const version: VersionTuple = [2, 5, 1]
            const target: VersionTuple = [2, 5, 1]
            const current: VersionTuple = [1, 5, 0]
            expect(VersionController.isVesionBetween(version, target, current)).toBe(true)
        })

        it("should return false when version between but equal to current (edge case)", () => {
            const version: VersionTuple = [1, 2, 1]
            const target: VersionTuple = [1, 5, 2]
            const current: VersionTuple = [1, 2, 1]
            expect(VersionController.isVesionBetween(version, target, current)).toBe(false)
        })

        it("should compare lexicographically: major precedence", () => {
            const version: VersionTuple = [2, 0, 0]
            const target: VersionTuple = [3, 0, 0]
            const current: VersionTuple = [1, 0, 0]
            expect(VersionController.isVesionBetween(version, target, current)).toBe(true)
        })

        it("should compare lexicographically: minor precedence when major equal", () => {
            const version: VersionTuple = [1, 2, 0]
            const target: VersionTuple = [1, 3, 0]
            const current: VersionTuple = [1, 1, 0]
            expect(VersionController.isVesionBetween(version, target, current)).toBe(true)
        })

        it("should compare lexicographically: patch precedence when major and minor equal", () => {
            const version: VersionTuple = [1, 0, 2]
            const target: VersionTuple = [1, 0, 3]
            const current: VersionTuple = [1, 0, 1]
            expect(VersionController.isVesionBetween(version, target, current)).toBe(true)
        })

        it("should return false when version lexicographically between but patch exceeds target", () => {
            const version: VersionTuple = [1, 0, 4]
            const target: VersionTuple = [1, 0, 3]
            const current: VersionTuple = [1, 0, 1]
            expect(VersionController.isVesionBetween(version, target, current)).toBe(false)
        })

        it("should handle negative? (versions are unsigned, but test robustness)", () => {
            const version: VersionTuple = [0, 0, 1]
            const target: VersionTuple = [1, 0, 0]
            const current: VersionTuple = [0, 0, 1]
            expect(VersionController.isVesionBetween(version, target, current)).toBe(false)
        })

        it("should work with large numbers", () => {
            const version: VersionTuple = [999999, 888888, 777777]
            const target: VersionTuple = [1000000, 0, 0]
            const current: VersionTuple = [999999, 0, 0]
            expect(VersionController.isVesionBetween(version, target, current)).toBe(true)
        })

        it("should return false when current > target (invalid range)", () => {
            const version: VersionTuple = [1, 5, 0]
            const target: VersionTuple = [1, 0, 0]
            const current: VersionTuple = [2, 0, 0]
            expect(VersionController.isVesionBetween(version, target, current)).toBe(false)
        })
    })

    describe("compareVersions", () => {
        it("should return 1 when version1 major > version2 major", () => {
            const v1: VersionTuple = [2, 0, 0]
            const v2: VersionTuple = [1, 0, 0]
            expect(VersionController.compareVersions(v1, v2)).toBe(1)
        })

        it("should return -1 when version1 major < version2 major", () => {
            const v1: VersionTuple = [1, 0, 0]
            const v2: VersionTuple = [2, 0, 0]
            expect(VersionController.compareVersions(v1, v2)).toBe(-1)
        })

        it("should return 1 when major equal, version1 minor > version2 minor", () => {
            const v1: VersionTuple = [1, 2, 0]
            const v2: VersionTuple = [1, 1, 0]
            expect(VersionController.compareVersions(v1, v2)).toBe(1)
        })

        it("should return -1 when major equal, version1 minor < version2 minor", () => {
            const v1: VersionTuple = [1, 1, 0]
            const v2: VersionTuple = [1, 2, 0]
            expect(VersionController.compareVersions(v1, v2)).toBe(-1)
        })

        it("should return 1 when major and minor equal, version1 patch > version2 patch", () => {
            const v1: VersionTuple = [1, 2, 3]
            const v2: VersionTuple = [1, 2, 2]
            expect(VersionController.compareVersions(v1, v2)).toBe(1)
        })

        it("should return -1 when major and minor equal, version1 patch < version2 patch", () => {
            const v1: VersionTuple = [1, 2, 2]
            const v2: VersionTuple = [1, 2, 3]
            expect(VersionController.compareVersions(v1, v2)).toBe(-1)
        })

        it("should return 0 when versions are completely equal", () => {
            const v1: VersionTuple = [1, 2, 3]
            const v2: VersionTuple = [1, 2, 3]
            expect(VersionController.compareVersions(v1, v2)).toBe(0)
        })

        it("should return 0 when all components equal (multi-digit)", () => {
            const v1: VersionTuple = [123, 456, 789]
            const v2: VersionTuple = [123, 456, 789]
            expect(VersionController.compareVersions(v1, v2)).toBe(0)
        })

        it("should handle comparison with multi-digit numbers across components", () => {
            const v1: VersionTuple = [100, 200, 300]
            const v2: VersionTuple = [99, 999, 999]
            expect(VersionController.compareVersions(v1, v2)).toBe(1)
        })
    })
})