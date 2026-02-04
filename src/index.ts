export interface VariableDefinition<T = unknown> {
    /**
     * The logical name/key under which the variable will be exposed
     * in the returned object (e.g., "apiKey" or "databaseUrlDev").
     *
     * By default, this also serves as the environment variable name.
     * If you want to read from a different environment variable, set `envName`.
     */
    name: string;

    /**
     * A custom parser for the variable value (e.g., parseInt or Boolean).
     */
    type?: (val: string) => T;

    /**
     * The actual environment variable name to read from
     * (e.g., "DATABASE_URL_DEV"). If omitted, `name` is used.
     *
     * This allows using a friendly `name` for the exposed key while
     * still reading from a conventional ENV var name.
     */
    envName?: string;

    /**
     * Optional project this variable belongs to. Useful in monorepo setups.
     * Defaults to "env".
     */
    project?: string;

    /**
     * Whether the variable is required to be set.
     */
    required: boolean;

    /**
     * A fallback value if none is provided.
     */
    default?: T;

    /**
     * Optional CLI flag (e.g., --token) that can be used instead of ENV.
     */
    useFlagInstead?: string;

    /**
     * Only load the variable if this CLI flag is present.
     */
    useWithFlag?: string;

    /**
     * Whether to quit the process if a required variable is missing.
     */
    quitOnMissing?: boolean;
}

type ProjectVars = Record<string, Record<string, any>>;

export class EnvManager<T extends ProjectVars = {}> {
    private definitions: VariableDefinition<any>[] = [];

    /**
     * Adds a new variable definition.
     *
     * @param def The variable definition to add.
     * @returns The updated EnvManager instance.
     */
    add<
        const K extends string,
        const P extends string = "env",
        V = string
    >(def: VariableDefinition<V> & { name: K; project?: P }): EnvManager<
        T & { [key in P]: { [k in K]: V } }
    > {
        this.definitions.push(def);
        return this as any;
    }

    /**
     * Retrieves the value of a CLI flag.
     *
     * @param flag The CLI flag to check (e.g., "--token").
     * @returns The value of the flag or undefined if not set.
     */
    private getFlagValue(flag: string): string | undefined {
        const idx = process.argv.indexOf(flag);
        if (idx !== -1 && process.argv[idx + 1]) {
            return process.argv[idx + 1];
        }
        return undefined;
    }

    /**
     * Loads the environment variables based on the defined variable definitions.
     *
     * @returns An object containing the loaded variables grouped by project.
     * @throws Error if a required variable is missing and quitOnMissing is true.
     */
    load(): T {
        const result: ProjectVars = {};

        for (const def of this.definitions) {
            const {
                name,
                envName,
                project = "env",
                required = false,
                default: defVal,
                type = (v => v) as (val: string) => any,
                useFlagInstead,
                useWithFlag,
                quitOnMissing,
            } = def;

            if (!result[project]) result[project] = {};

            if (useWithFlag && !process.argv.includes(useWithFlag)) {
                continue;
            }

            // First try CLI flag, then fallback to env var
            const envVarKey = envName ?? name;
            const raw = (useFlagInstead && this.getFlagValue(useFlagInstead)) || process.env[envVarKey];

            if (raw === undefined || raw === "") {
                if (defVal !== undefined) {
                    result[project][name] = defVal;
                } else if (required) {
                    const msg = `Missing required variable/flag: ${name}${useFlagInstead ? ` (flag: ${useFlagInstead})` : ""}`;
                    if (quitOnMissing !== false) throw new Error(msg);
                    else console.warn(msg);
                }
            } else {
                try {
                    result[project][name] = type(raw);
                } catch (e) {
                    throw new Error(`Failed to parse variable "${name}": ${(e as Error).message}`);
                }
            }
        }

        return result as T;
    }
}
