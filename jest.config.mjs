/** @type {import('jest').Config} */
export default {
    testEnvironment: 'node',
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                useESM: true,
                tsconfig: 'tsconfig.test.json',
            },
        ],
    },
    extensionsToTreatAsEsm: ['.ts'],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['json', 'lcov', 'text'],
};
