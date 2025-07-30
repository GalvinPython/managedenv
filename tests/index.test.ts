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
                flag: "--discord-token",
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
                flag: "--port",
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
                flag: "--port",
                type: Number,
                project: "apiServer",
                required: false
            });

        const env = manager.load();

        expect(env.apiServer.PORT).toBe(8080);
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
});
