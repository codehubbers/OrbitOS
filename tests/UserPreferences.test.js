// Regression test for PR #132 review: `preferences.sound` must be declared in
// the User schema, otherwise Mongoose strict mode silently drops it on save
// and the "Play startup sound" toggle can never persist in production.
//
// Jest can't import real mongoose (its driver chain ships untransformed ESM),
// so we capture the schema definition through a minimal mock instead.

let capturedSchema;

jest.mock('mongoose', () => {
  class Schema {
    constructor(definition) {
      capturedSchema = definition;
      this.methods = {};
    }
    pre() {}
  }
  const model = jest.fn((name, schema) => ({ modelName: name, schema }));
  return {
    __esModule: true,
    default: { Schema, model, models: {} },
    Schema,
    model,
    models: {},
  };
});

jest.mock('bcryptjs', () => ({
  __esModule: true,
  default: { hash: jest.fn(), compare: jest.fn() },
}));

require('@/models/User');

describe('User preferences schema', () => {
  it('declares preferences.sound.startupSound, defaulting to false', () => {
    expect(capturedSchema.preferences).toMatchObject({
      sound: {
        startupSound: { type: Boolean, default: false },
      },
    });
  });

  // Same strict-mode lesson as sound.startupSound (#132): without this,
  // the "Lock after inactivity" setting could never persist.
  it('declares preferences.security.lockAfterMinutes, defaulting to 10', () => {
    expect(capturedSchema.preferences).toMatchObject({
      security: {
        lockAfterMinutes: { type: Number, default: 10 },
      },
    });
  });
});
