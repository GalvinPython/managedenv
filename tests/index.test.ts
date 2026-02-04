import { EnvManager } from "../src/index";

describe("EnvManager", () => {
    beforeEach(() => {
        // Reset environment variables and CLI args before each test
        process.env = {};
        process.argv = ["node", "script.js"];
    });

    it("should load string from environment variable", () => {
        process.env.DISCORD_TOKEN = "abc123";

        const manager = new EnvManager()
            .add({
                name: "DISCORD_TOKEN",
                useFlagInstead: "--discord-token",
                type: String,
                project: "discordBot",
                required: true,
            });

        const env = manager.load();

        expect(env.discordBot.DISCORD_TOKEN).toBe("abc123");
    });

    it("should load number from default if not provided", () => {
        const manager = new EnvManager()
            .add({
                name: "PORT",
                useFlagInstead: "--port",
                type: Number,
                project: "apiServer",
                default: 3000,
                required: false
            });

        const env = manager.load();

        expect(env.apiServer.PORT).toBe(3000);
    });

    it("should use CLI flag over environment variable", () => {
        process.env.PORT = "3000";
        process.argv.push("--port", "8080");

        const manager = new EnvManager()
            .add({
                name: "PORT",
                useFlagInstead: "--port",
                type: Number,
                project: "apiServer",
                required: false
            });

        const env = manager.load();

        expect(env.apiServer.PORT).toBe(8080);
    });

    it("should load variable only when useWithFlag is present", () => {
        process.env.POSTGRES_DEV_URL = "postgres://user:pass@localhost:5432/devdb";
        process.argv.push("--dev");

        const manager = new EnvManager().add({
            name: "POSTGRES_DEV_URL",
            type: String,
            required: true,
            useWithFlag: "--dev",
        });

        const env = manager.load();

        expect(env.env.POSTGRES_DEV_URL).toBe("postgres://user:pass@localhost:5432/devdb");
    });

    it("should ignore variable when useWithFlag flag is not present", () => {
        process.env.POSTGRES_DEV_URL = "postgres://user:pass@localhost:5432/devdb";

        const manager = new EnvManager().add({
            name: "POSTGRES_DEV_URL",
            type: String,
            required: true,
            useWithFlag: "--dev",
        });

        const env = manager.load();

        expect(env.env.POSTGRES_DEV_URL).toBeUndefined();
    });

    it("should not throw required error when useWithFlag is missing", () => {
        const manager = new EnvManager().add({
            name: "POSTGRES_DEV_URL",
            required: true,
            useWithFlag: "--dev",
        });

        expect(() => manager.load()).not.toThrow();
    });

    it("should throw when useWithFlag is present but variable is missing", () => {
        process.argv.push("--dev");

        const manager = new EnvManager().add({
            name: "POSTGRES_DEV_URL",
            required: true,
            useWithFlag: "--dev",
        });

        expect(() => manager.load()).toThrow(
            "Missing required variable/flag: POSTGRES_DEV_URL"
        );
    });

    it("should only apply default when useWithFlag is present", () => {
        const manager = new EnvManager().add({
            name: "OPTIONAL_DEV_ONLY",
            default: "dev-default",
            useWithFlag: "--dev",
            required: false,
        });

        // flag not present
        let env = manager.load();
        expect(env.env.OPTIONAL_DEV_ONLY).toBeUndefined();

        // flag present
        process.argv.push("--dev");
        env = manager.load();
        expect(env.env.OPTIONAL_DEV_ONLY).toBe("dev-default");
    });

    it("should combine useWithFlag and useFlagInstead correctly", () => {
        process.argv.push("--dev", "--db-url", "postgres://flag");

        const manager = new EnvManager().add({
            name: "POSTGRES_DEV_URL",
            useWithFlag: "--dev",
            useFlagInstead: "--db-url",
            type: String,
            required: true,
        });

        const env = manager.load();

        expect(env.env.POSTGRES_DEV_URL).toBe("postgres://flag");
    });

    it("should throw for missing required variable", () => {
        const manager = new EnvManager()
            .add({
                name: "MISSING_VAR",
                type: String,
                required: true,
            });

        expect(() => manager.load()).toThrow("Missing required variable/flag: MISSING_VAR");
    });

    it("should warn but not throw if quitOnMissing is false", () => {
        const originalWarn = console.warn;
        const warnMock = jest.fn();
        console.warn = warnMock;

        const manager = new EnvManager()
            .add({
                name: "OPTIONAL_BUT_LOG",
                type: String,
                required: true,
                quitOnMissing: false,
            });

        const env = manager.load();

        expect(env.env.OPTIONAL_BUT_LOG).toBeUndefined();
        expect(warnMock).toHaveBeenCalledWith(
            "Missing required variable/flag: OPTIONAL_BUT_LOG"
        );

        console.warn = originalWarn;
    });


    it("should throw if the type parser throws", () => {
        const manager = new EnvManager()
            .add({
                name: "FAIL_PARSE",
                required: true,
                type: () => {
                    throw new Error("intentional failure");
                }
            });

        process.env.FAIL_PARSE = "boom";

        expect(() => manager.load()).toThrow(
            'Failed to parse variable "FAIL_PARSE": intentional failure'
        );
    });

    it("warns when quitOnMissing is false and env var is missing", () => {
        const warn = jest.spyOn(console, "warn").mockImplementation(() => { });

        const manager = new EnvManager().add({
            name: "MISSING_VAR",
            required: true,
            quitOnMissing: false,
        });

        delete process.env.MISSING_VAR;

        const env = manager.load();

        expect(env.env.MISSING_VAR).toBeUndefined();
        expect(warn).toHaveBeenCalledWith(
            "Missing required variable/flag: MISSING_VAR"
        );

        warn.mockRestore();
    });

    it("should use default identity type parser if none provided", () => {
        process.env.TEST_VAR = "raw_value";

        const manager = new EnvManager()
            .add({
                name: "TEST_VAR",
                required: true,
                // no 'type' property here
            });

        const env = manager.load();

        expect(env.env.TEST_VAR).toBe("raw_value");
    });

    it("should expose value under custom name while reading from envName", () => {
        process.env.DATABASE_URL_DEV = "postgres://env";

        const manager = new EnvManager()
            .add({
                name: "databaseUrlDev",
                envName: "DATABASE_URL_DEV",
                type: String,
                project: "envs",
                required: true,
            });

        const env = manager.load();

        expect(env.envs.databaseUrlDev).toBe("postgres://env");
        // original env-style key should not exist under project
        // (back-compat preserved for users not using envName)
        // @ts-expect-error - type system won't know this key
        expect(env.envs.DATABASE_URL_DEV).toBeUndefined();
    });

    it("should prefer CLI flag and still expose under custom name", () => {
        process.env.DATABASE_URL_DEV = "postgres://env";
        process.argv.push("--db-url", "postgres://flag");

        const manager = new EnvManager()
            .add({
                name: "databaseUrlDev",
                envName: "DATABASE_URL_DEV",
                useFlagInstead: "--db-url",
                type: String,
                project: "envs",
                required: true,
            });

        const env = manager.load();

        expect(env.envs.databaseUrlDev).toBe("postgres://flag");
    });
});
