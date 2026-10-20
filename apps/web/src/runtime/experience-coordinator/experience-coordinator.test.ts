import type { WebGPURenderer } from 'three/webgpu';
import { expect, test, vi } from 'vitest';

import type { CreationExperience, CreationExperiencePreparationOptions } from '../../types';
import { ExperienceCoordinator } from './experience-coordinator';
import { EXPERIENCE_COORDINATOR_ERROR_CODES } from './experience-coordinator-errors';

function createExperience() {
  return {
    activate: vi.fn(),
    update: vi.fn(),
    render: vi.fn(),
    resize: vi.fn(),
    suspend: vi.fn(),
    resume: vi.fn(),
    dispose: vi.fn(),
  } satisfies CreationExperience;
}

function createPreparationOptions() {
  return {
    renderer: {} as WebGPURenderer,
    viewport: { widthCssPx: 800, heightCssPx: 600, pixelRatio: 1 },
    signal: new AbortController().signal,
  };
}

function createPendingPreparation() {
  const completion = Promise.withResolvers<CreationExperience>();
  const prepare = vi.fn((_options: CreationExperiencePreparationOptions) => completion.promise);
  return { ...completion, prepare };
}

test.each(['ready', 'failed'] as const)(
  'keeps only the latest request eligible when it becomes %s',
  async (outcome) => {
    const coordinator = new ExperienceCoordinator(createPreparationOptions());
    const current = createExperience();
    await coordinator.prepareAndActivateExperience(async () => current);
    const obsolete = createPendingPreparation();
    const obsoleteOperation = coordinator.prepareAndActivateExperience(obsolete.prepare);
    const obsoleteRejection = expect(obsoleteOperation).rejects.toMatchObject({
      code: EXPERIENCE_COORDINATOR_ERROR_CODES.PREPARATION_SUPERSEDED,
    });
    await Promise.resolve();
    const latest = createPendingPreparation();
    const latestOperation = coordinator.prepareAndActivateExperience(latest.prepare);
    expect(obsolete.prepare.mock.calls[0]?.[0].signal.aborted).toBe(true);
    coordinator.renderActiveExperience();
    expect(current.render).toHaveBeenCalledOnce();
    expect(current.dispose).not.toHaveBeenCalled();

    const next = createExperience();
    if (outcome === 'ready') {
      latest.resolve(next);
      await latestOperation;
    } else {
      const cause = new Error('Latest preparation failed.');
      latest.reject(cause);
      await expect(latestOperation).rejects.toBe(cause);
    }

    const stale = createExperience();
    obsolete.resolve(stale);
    await obsoleteRejection;
    expect(stale.activate).not.toHaveBeenCalled();
    expect(stale.dispose).toHaveBeenCalledOnce();
    current.render.mockClear();
    coordinator.renderActiveExperience();
    expect(current.render).toHaveBeenCalledTimes(outcome === 'failed' ? 1 : 0);
    expect(next.render).toHaveBeenCalledTimes(outcome === 'ready' ? 1 : 0);
    await coordinator.dispose();
  }
);

test('does not let obsolete settlement erase the latest cancellation controller', async () => {
  const coordinator = new ExperienceCoordinator(createPreparationOptions());
  const first = createPendingPreparation();
  const firstOperation = coordinator.prepareAndActivateExperience(first.prepare);
  const firstRejection = expect(firstOperation).rejects.toMatchObject({
    code: EXPERIENCE_COORDINATOR_ERROR_CODES.PREPARATION_SUPERSEDED,
  });
  await Promise.resolve();
  const second = createPendingPreparation();
  const secondOperation = coordinator.prepareAndActivateExperience(second.prepare);
  const secondRejection = expect(secondOperation).rejects.toMatchObject({
    code: EXPERIENCE_COORDINATOR_ERROR_CODES.PREPARATION_SUPERSEDED,
  });
  await Promise.resolve();
  first.resolve(createExperience());
  await firstRejection;

  const thirdExperience = createExperience();
  await coordinator.prepareAndActivateExperience(async () => thirdExperience);
  expect(second.prepare.mock.calls[0]?.[0].signal.aborted).toBe(true);
  second.resolve(createExperience());
  await secondRejection;
  coordinator.renderActiveExperience();
  expect(thirdExperience.render).toHaveBeenCalledOnce();
  await coordinator.dispose();
});

test('awaits obsolete preparations as well as the latest one during disposal', async () => {
  const coordinator = new ExperienceCoordinator(createPreparationOptions());
  const obsolete = createPendingPreparation();
  const obsoleteOperation = coordinator.prepareAndActivateExperience(obsolete.prepare);
  const obsoleteRejection = expect(obsoleteOperation).rejects.toMatchObject({
    code: EXPERIENCE_COORDINATOR_ERROR_CODES.PREPARATION_SUPERSEDED,
  });
  await Promise.resolve();
  const latest = createPendingPreparation();
  const latestOperation = coordinator.prepareAndActivateExperience(latest.prepare);
  const latestRejection = expect(latestOperation).rejects.toMatchObject({
    code: EXPERIENCE_COORDINATOR_ERROR_CODES.DISPOSED,
  });
  await Promise.resolve();

  const disposal = coordinator.dispose();
  let disposalFinished = false;
  const observedDisposal = disposal.then(() => {
    disposalFinished = true;
  });
  const latestInstance = createExperience();
  latest.resolve(latestInstance);
  await latestRejection;
  expect(disposalFinished).toBe(false);
  const obsoleteInstance = createExperience();
  obsolete.resolve(obsoleteInstance);
  await obsoleteRejection;
  await observedDisposal;
  expect(latestInstance.activate).not.toHaveBeenCalled();
  expect(obsoleteInstance.activate).not.toHaveBeenCalled();
  expect(latestInstance.dispose).toHaveBeenCalledOnce();
  expect(obsoleteInstance.dispose).toHaveBeenCalledOnce();
});

test('skips a superseded preparer even before its first execution', async () => {
  const coordinator = new ExperienceCoordinator(createPreparationOptions());
  const obsoletePreparer = vi.fn(async () => createExperience());
  const obsoleteOperation = coordinator.prepareAndActivateExperience(obsoletePreparer);
  const latest = createExperience();
  const latestOperation = coordinator.prepareAndActivateExperience(async () => latest);
  await expect(obsoleteOperation).rejects.toMatchObject({
    code: EXPERIENCE_COORDINATOR_ERROR_CODES.PREPARATION_SUPERSEDED,
  });
  await latestOperation;
  expect(obsoletePreparer).not.toHaveBeenCalled();
  expect(latest.activate).toHaveBeenCalledOnce();
  await coordinator.dispose();
});

test('keeps a request triggered by an abort callback newer than the request that caused it', async () => {
  const coordinator = new ExperienceCoordinator(createPreparationOptions());
  const first = createPendingPreparation();
  const finalExperience = createExperience();
  let finalOperation: Promise<void> | undefined;
  const firstOperation = coordinator.prepareAndActivateExperience((options) => {
    options.signal.addEventListener(
      'abort',
      () => {
        finalOperation = coordinator.prepareAndActivateExperience(async () => finalExperience);
      },
      { once: true }
    );
    return first.promise;
  });
  const firstRejection = expect(firstOperation).rejects.toMatchObject({
    code: EXPERIENCE_COORDINATOR_ERROR_CODES.PREPARATION_SUPERSEDED,
  });
  await Promise.resolve();
  const middlePreparer = vi.fn(async () => createExperience());
  const middleOperation = coordinator.prepareAndActivateExperience(middlePreparer);
  await expect(middleOperation).rejects.toMatchObject({
    code: EXPERIENCE_COORDINATOR_ERROR_CODES.PREPARATION_SUPERSEDED,
  });
  await finalOperation;
  first.resolve(createExperience());
  await firstRejection;
  expect(middlePreparer).not.toHaveBeenCalled();
  expect(finalExperience.activate).toHaveBeenCalledOnce();
  await coordinator.dispose();
});

test('blocks calls immediately and releases the active instance once without disposing the renderer', async () => {
  const disposeRenderer = vi.fn();
  const options = createPreparationOptions();
  Object.assign(options.renderer, { dispose: disposeRenderer });
  const coordinator = new ExperienceCoordinator(options);
  const experience = createExperience();
  await coordinator.prepareAndActivateExperience(async () => experience);
  experience.resize.mockClear();

  const disposal = coordinator.dispose();
  expect(coordinator.dispose()).toBe(disposal);
  coordinator.updateActiveExperience({ deltaSeconds: 0, elapsedSeconds: 0 });
  coordinator.renderActiveExperience();
  coordinator.resizeActiveExperience(options.viewport);
  coordinator.suspendActiveExperience();
  coordinator.resumeActiveExperience();
  expect(experience.update).not.toHaveBeenCalled();
  expect(experience.render).not.toHaveBeenCalled();
  expect(experience.resize).not.toHaveBeenCalled();
  expect(experience.suspend).not.toHaveBeenCalled();
  expect(experience.resume).not.toHaveBeenCalled();
  await disposal;
  expect(experience.dispose).toHaveBeenCalledOnce();
  expect(disposeRenderer).not.toHaveBeenCalled();
  await expect(
    coordinator.prepareAndActivateExperience(async () => createExperience())
  ).rejects.toMatchObject({
    code: EXPERIENCE_COORDINATOR_ERROR_CODES.DISPOSED,
  });
});

test('cancels preparation immediately and waits for a late instance to be released', async () => {
  const coordinator = new ExperienceCoordinator(createPreparationOptions());
  const preparation = Promise.withResolvers<CreationExperience>();
  const prepareExperience = vi.fn(
    (_options: CreationExperiencePreparationOptions) => preparation.promise
  );
  const activation = coordinator.prepareAndActivateExperience(prepareExperience);
  await Promise.resolve();
  const signal = prepareExperience.mock.calls[0]?.[0].signal;

  const disposal = coordinator.dispose();
  expect(signal?.aborted).toBe(true);
  expect(signal?.reason).toMatchObject({ code: EXPERIENCE_COORDINATOR_ERROR_CODES.DISPOSED });
  let disposalFinished = false;
  const observedDisposal = disposal.then(() => {
    disposalFinished = true;
  });
  await Promise.resolve();
  expect(disposalFinished).toBe(false);

  const experience = createExperience();
  preparation.resolve(experience);
  await expect(activation).rejects.toBe(signal?.reason);
  await observedDisposal;
  expect(experience.activate).not.toHaveBeenCalled();
  expect(experience.dispose).toHaveBeenCalledOnce();
});

test('still waits when the preparer itself requests coordinator disposal', async () => {
  const coordinator = new ExperienceCoordinator(createPreparationOptions());
  const preparation = Promise.withResolvers<CreationExperience>();
  let disposal: Promise<void> | undefined;
  const activation = coordinator.prepareAndActivateExperience(() => {
    disposal = coordinator.dispose();
    return preparation.promise;
  });
  await Promise.resolve();
  expect(disposal).toBeInstanceOf(Promise);

  const experience = createExperience();
  preparation.resolve(experience);
  await expect(activation).rejects.toMatchObject({
    code: EXPERIENCE_COORDINATOR_ERROR_CODES.DISPOSED,
  });
  await disposal;
  expect(experience.dispose).toHaveBeenCalledOnce();
  expect(experience.activate).not.toHaveBeenCalled();
});

test('does not activate if applying dimensions triggers disposal', async () => {
  const coordinator = new ExperienceCoordinator(createPreparationOptions());
  const experience = createExperience();
  experience.resize.mockImplementationOnce(() => {
    void coordinator.dispose();
  });
  await expect(
    coordinator.prepareAndActivateExperience(async () => experience)
  ).rejects.toMatchObject({
    code: EXPERIENCE_COORDINATOR_ERROR_CODES.DISPOSED,
  });
  await coordinator.dispose();
  expect(experience.activate).not.toHaveBeenCalled();
  expect(experience.dispose).toHaveBeenCalledOnce();
});

test('retains active-instance cleanup failure in a repeatable rejected disposal', async () => {
  const coordinator = new ExperienceCoordinator(createPreparationOptions());
  const experience = createExperience();
  await coordinator.prepareAndActivateExperience(async () => experience);
  const cause = new Error('Experience cleanup failed.');
  experience.dispose.mockImplementationOnce(() => {
    throw cause;
  });

  const disposal = coordinator.dispose();
  await expect(disposal).rejects.toMatchObject({
    code: EXPERIENCE_COORDINATOR_ERROR_CODES.DISPOSAL_FAILED,
    cause: { errors: [cause] },
  });
  expect(coordinator.dispose()).toBe(disposal);
  expect(experience.dispose).toHaveBeenCalledOnce();
});

test('reports late-instance cleanup failure through both preparation and disposal', async () => {
  const coordinator = new ExperienceCoordinator(createPreparationOptions());
  const preparation = Promise.withResolvers<CreationExperience>();
  const activation = coordinator.prepareAndActivateExperience(() => preparation.promise);
  await Promise.resolve();
  const disposal = coordinator.dispose();
  const experience = createExperience();
  const cause = new Error('Late instance cleanup failed.');
  experience.dispose.mockImplementationOnce(() => {
    throw cause;
  });
  preparation.resolve(experience);

  await expect(activation).rejects.toMatchObject({
    code: EXPERIENCE_COORDINATOR_ERROR_CODES.PREPARATION_AND_CLEANUP_FAILED,
    cause: {
      errors: [
        expect.objectContaining({ code: EXPERIENCE_COORDINATOR_ERROR_CODES.DISPOSED }),
        cause,
      ],
    },
  });
  await expect(disposal).rejects.toMatchObject({
    code: EXPERIENCE_COORDINATOR_ERROR_CODES.DISPOSAL_FAILED,
    cause: {
      errors: [
        expect.objectContaining({
          code: EXPERIENCE_COORDINATOR_ERROR_CODES.PREPARATION_AND_CLEANUP_FAILED,
        }),
      ],
    },
  });
  expect(experience.dispose).toHaveBeenCalledOnce();
});

test('treats external cancellation as expected while awaiting disposal', async () => {
  const controller = new AbortController();
  const coordinator = new ExperienceCoordinator({
    ...createPreparationOptions(),
    signal: controller.signal,
  });
  const preparation = Promise.withResolvers<CreationExperience>();
  const activation = coordinator.prepareAndActivateExperience(() => preparation.promise);
  await Promise.resolve();
  const reason = new Error('External cancellation.');
  controller.abort(reason);
  const disposal = coordinator.dispose();
  const experience = createExperience();
  preparation.resolve(experience);

  await expect(activation).rejects.toBe(reason);
  await disposal;
  expect(experience.dispose).toHaveBeenCalledOnce();
});

test('waits for a ready instance before activating and retaining it', async () => {
  const options = createPreparationOptions();
  const coordinator = new ExperienceCoordinator(options);
  const experience = createExperience();
  const preparation = Promise.withResolvers<CreationExperience>();
  const prepareExperience = vi.fn(() => preparation.promise);
  const frameTime = { deltaSeconds: 0.016, elapsedSeconds: 1 };

  coordinator.updateActiveExperience(frameTime);
  coordinator.renderActiveExperience();

  const activation = coordinator.prepareAndActivateExperience(prepareExperience);
  await Promise.resolve();
  expect(prepareExperience).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({
      renderer: options.renderer,
      viewport: options.viewport,
    })
  );
  expect(experience.activate).not.toHaveBeenCalled();
  coordinator.updateActiveExperience(frameTime);
  coordinator.renderActiveExperience();
  expect(experience.update).not.toHaveBeenCalled();
  expect(experience.render).not.toHaveBeenCalled();

  preparation.resolve(experience);
  await activation;
  expect(experience.activate).toHaveBeenCalledOnce();
  expect(experience.dispose).not.toHaveBeenCalled();
  coordinator.updateActiveExperience(frameTime);
  coordinator.renderActiveExperience();
  expect(experience.update).toHaveBeenCalledExactlyOnceWith(frameTime);
  expect(experience.render).toHaveBeenCalledExactlyOnceWith(options.renderer);
});

test('keeps the current experience usable until replacement, then releases it after selection', async () => {
  const coordinator = new ExperienceCoordinator(createPreparationOptions());
  const previousExperience = createExperience();
  await coordinator.prepareAndActivateExperience(async () => previousExperience);
  const nextExperience = createExperience();
  const preparation = Promise.withResolvers<CreationExperience>();
  const replacement = coordinator.prepareAndActivateExperience(() => preparation.promise);
  const frameTime = { deltaSeconds: 0.016, elapsedSeconds: 1 };

  coordinator.updateActiveExperience(frameTime);
  coordinator.renderActiveExperience();
  expect(previousExperience.update).toHaveBeenCalledOnce();
  expect(previousExperience.render).toHaveBeenCalledOnce();
  expect(previousExperience.dispose).not.toHaveBeenCalled();
  expect(nextExperience.update).not.toHaveBeenCalled();
  expect(nextExperience.render).not.toHaveBeenCalled();

  previousExperience.dispose.mockImplementationOnce(() => {
    coordinator.renderActiveExperience();
    expect(nextExperience.render).toHaveBeenCalledOnce();
  });
  preparation.resolve(nextExperience);
  await replacement;
  expect(nextExperience.activate.mock.invocationCallOrder[0]).toBeLessThan(
    previousExperience.dispose.mock.invocationCallOrder[0] ?? 0
  );
  expect(previousExperience.dispose).toHaveBeenCalledOnce();
  coordinator.updateActiveExperience(frameTime);
  expect(nextExperience.update).toHaveBeenCalledOnce();
  expect(previousExperience.update).toHaveBeenCalledOnce();
  await coordinator.dispose();
  expect(previousExperience.dispose).toHaveBeenCalledOnce();
  expect(nextExperience.dispose).toHaveBeenCalledOnce();
});

test.each(['preparation', 'activation'] as const)(
  'retains the current instance after incoming %s fails',
  async (step) => {
    const coordinator = new ExperienceCoordinator(createPreparationOptions());
    const previousExperience = createExperience();
    await coordinator.prepareAndActivateExperience(async () => previousExperience);
    const nextExperience = createExperience();
    const cause = new Error('Incoming experience failed.');
    if (step === 'activation') {
      nextExperience.activate.mockImplementationOnce(() => {
        throw cause;
      });
    }

    await expect(
      coordinator.prepareAndActivateExperience(async () => {
        if (step === 'preparation') {
          throw cause;
        }
        return nextExperience;
      })
    ).rejects.toBe(cause);
    coordinator.renderActiveExperience();
    expect(previousExperience.render).toHaveBeenCalledOnce();
    expect(previousExperience.dispose).not.toHaveBeenCalled();
    expect(nextExperience.render).not.toHaveBeenCalled();
    expect(nextExperience.dispose).toHaveBeenCalledTimes(step === 'activation' ? 1 : 0);
    await coordinator.dispose();
  }
);

test('keeps the new instance active if previous-instance cleanup fails', async () => {
  const coordinator = new ExperienceCoordinator(createPreparationOptions());
  const previousExperience = createExperience();
  await coordinator.prepareAndActivateExperience(async () => previousExperience);
  const cause = new Error('Previous experience cleanup failed.');
  previousExperience.dispose.mockImplementationOnce(() => {
    throw cause;
  });
  const nextExperience = createExperience();

  await expect(
    coordinator.prepareAndActivateExperience(async () => nextExperience)
  ).rejects.toMatchObject({
    code: EXPERIENCE_COORDINATOR_ERROR_CODES.PREVIOUS_EXPERIENCE_DISPOSAL_FAILED,
    cause,
  });
  coordinator.renderActiveExperience();
  expect(nextExperience.render).toHaveBeenCalledOnce();
  expect(nextExperience.dispose).not.toHaveBeenCalled();
  expect(previousExperience.render).not.toHaveBeenCalled();
  await coordinator.dispose();
  expect(nextExperience.dispose).toHaveBeenCalledOnce();
});

test('releases both current and late incoming instances when disposed during replacement', async () => {
  const coordinator = new ExperienceCoordinator(createPreparationOptions());
  const previousExperience = createExperience();
  await coordinator.prepareAndActivateExperience(async () => previousExperience);
  const preparation = Promise.withResolvers<CreationExperience>();
  const replacement = coordinator.prepareAndActivateExperience(() => preparation.promise);
  await Promise.resolve();

  const disposal = coordinator.dispose();
  const nextExperience = createExperience();
  preparation.resolve(nextExperience);
  await expect(replacement).rejects.toMatchObject({
    code: EXPERIENCE_COORDINATOR_ERROR_CODES.DISPOSED,
  });
  await disposal;
  expect(nextExperience.activate).not.toHaveBeenCalled();
  expect(nextExperience.dispose).toHaveBeenCalledOnce();
  expect(previousExperience.dispose).toHaveBeenCalledOnce();
});

test('suspends frame work once and enables it only after the experience resumes', async () => {
  const coordinator = new ExperienceCoordinator(createPreparationOptions());
  const experience = createExperience();
  const frameTime = { deltaSeconds: 0.016, elapsedSeconds: 1 };
  await coordinator.prepareAndActivateExperience(async () => experience);

  coordinator.resumeActiveExperience();
  expect(experience.resume).not.toHaveBeenCalled();
  coordinator.suspendActiveExperience();
  coordinator.suspendActiveExperience();
  coordinator.updateActiveExperience(frameTime);
  coordinator.renderActiveExperience();
  expect(experience.suspend).toHaveBeenCalledOnce();
  expect(experience.update).not.toHaveBeenCalled();
  expect(experience.render).not.toHaveBeenCalled();

  experience.resume.mockImplementationOnce(() => {
    coordinator.updateActiveExperience(frameTime);
    coordinator.renderActiveExperience();
    expect(experience.update).not.toHaveBeenCalled();
    expect(experience.render).not.toHaveBeenCalled();
  });
  coordinator.resumeActiveExperience();
  coordinator.resumeActiveExperience();
  expect(experience.resume).toHaveBeenCalledOnce();
  coordinator.updateActiveExperience(frameTime);
  coordinator.renderActiveExperience();
  expect(experience.update).toHaveBeenCalledOnce();
  expect(experience.render).toHaveBeenCalledOnce();
});

test('suspends an instance that finishes preparation while the coordinator is suspended', async () => {
  const coordinator = new ExperienceCoordinator(createPreparationOptions());
  const experience = createExperience();
  const preparation = Promise.withResolvers<CreationExperience>();
  const activation = coordinator.prepareAndActivateExperience(() => preparation.promise);
  await Promise.resolve();
  coordinator.suspendActiveExperience();

  preparation.resolve(experience);
  await activation;
  expect(experience.activate).toHaveBeenCalledOnce();
  expect(experience.suspend).toHaveBeenCalledOnce();
  expect(experience.activate.mock.invocationCallOrder[0]).toBeLessThan(
    experience.suspend.mock.invocationCallOrder[0] ?? 0
  );
  coordinator.renderActiveExperience();
  expect(experience.render).not.toHaveBeenCalled();
  coordinator.resumeActiveExperience();
  coordinator.renderActiveExperience();
  expect(experience.resume).toHaveBeenCalledOnce();
  expect(experience.render).toHaveBeenCalledOnce();
});

test.each(['suspend', 'resume'] as const)(
  'keeps frame work blocked if %s fails',
  async (method) => {
    const coordinator = new ExperienceCoordinator(createPreparationOptions());
    const experience = createExperience();
    await coordinator.prepareAndActivateExperience(async () => experience);
    const cause = new Error('Experience visibility failed.');
    experience[method].mockImplementationOnce(() => {
      throw cause;
    });

    if (method === 'suspend') {
      expect(() => coordinator.suspendActiveExperience()).toThrow(cause);
    } else {
      coordinator.suspendActiveExperience();
      expect(() => coordinator.resumeActiveExperience()).toThrow(cause);
    }

    coordinator.updateActiveExperience({ deltaSeconds: 0.016, elapsedSeconds: 1 });
    coordinator.renderActiveExperience();
    expect(experience.update).not.toHaveBeenCalled();
    expect(experience.render).not.toHaveBeenCalled();
  }
);

test('releases a prepared instance whose initial suspension fails before selection', async () => {
  const coordinator = new ExperienceCoordinator(createPreparationOptions());
  coordinator.suspendActiveExperience();
  const experience = createExperience();
  const cause = new Error('Initial suspension failed.');
  experience.suspend.mockImplementationOnce(() => {
    throw cause;
  });

  await expect(coordinator.prepareAndActivateExperience(async () => experience)).rejects.toBe(
    cause
  );
  expect(experience.dispose).toHaveBeenCalledOnce();
  coordinator.resumeActiveExperience();
  coordinator.renderActiveExperience();
  expect(experience.resume).not.toHaveBeenCalled();
  expect(experience.render).not.toHaveBeenCalled();
});

test('uses the latest dimensions before preparation, after preparation and while active', async () => {
  const coordinator = new ExperienceCoordinator(createPreparationOptions());
  const beforePreparation = { widthCssPx: 900, heightCssPx: 600, pixelRatio: 1 };
  coordinator.resizeActiveExperience(beforePreparation);
  beforePreparation.widthCssPx = 1;

  const preparation = Promise.withResolvers<CreationExperience>();
  const prepareExperience = vi.fn(
    (_options: CreationExperiencePreparationOptions) => preparation.promise
  );
  const activation = coordinator.prepareAndActivateExperience(prepareExperience);
  await Promise.resolve();
  expect(prepareExperience).toHaveBeenCalledWith(
    expect.objectContaining({
      viewport: { widthCssPx: 900, heightCssPx: 600, pixelRatio: 1 },
    })
  );

  const experience = createExperience();
  const duringPreparation = { widthCssPx: 1200, heightCssPx: 600, pixelRatio: 2 };
  coordinator.resizeActiveExperience(duringPreparation);
  expect(experience.resize).not.toHaveBeenCalled();
  preparation.resolve(experience);
  await activation;
  expect(experience.resize).toHaveBeenCalledExactlyOnceWith(duringPreparation);
  expect(experience.resize.mock.invocationCallOrder[0]).toBeLessThan(
    experience.activate.mock.invocationCallOrder[0] ?? 0
  );

  const whileActive = { widthCssPx: 600, heightCssPx: 1200, pixelRatio: 1 };
  coordinator.resizeActiveExperience(whileActive);
  expect(experience.resize).toHaveBeenLastCalledWith(whileActive);
});

test('releases a prepared instance if applying current dimensions fails before activation', async () => {
  const coordinator = new ExperienceCoordinator(createPreparationOptions());
  const experience = createExperience();
  const cause = new Error('Camera resize failed.');
  experience.resize.mockImplementationOnce(() => {
    throw cause;
  });

  await expect(coordinator.prepareAndActivateExperience(async () => experience)).rejects.toBe(
    cause
  );
  expect(experience.activate).not.toHaveBeenCalled();
  expect(experience.dispose).toHaveBeenCalledOnce();
});

test('preserves preparation failures and allows a subsequent attempt', async () => {
  const coordinator = new ExperienceCoordinator(createPreparationOptions());
  const cause = new Error('Preparation failed.');
  await expect(
    coordinator.prepareAndActivateExperience(async () => {
      throw cause;
    })
  ).rejects.toBe(cause);

  const experience = createExperience();
  await coordinator.prepareAndActivateExperience(async () => experience);
  expect(experience.activate).toHaveBeenCalledOnce();
});

test('releases an instance returned after cancellation without activating it', async () => {
  const controller = new AbortController();
  const coordinator = new ExperienceCoordinator({
    ...createPreparationOptions(),
    signal: controller.signal,
  });
  const experience = createExperience();
  const preparation = Promise.withResolvers<CreationExperience>();
  const prepareExperience = vi.fn(
    (_options: CreationExperiencePreparationOptions) => preparation.promise
  );
  const activation = coordinator.prepareAndActivateExperience(prepareExperience);
  await Promise.resolve();
  const receivedSignal = prepareExperience.mock.calls[0]?.[0].signal;
  expect(receivedSignal).toBeInstanceOf(AbortSignal);
  expect(receivedSignal).not.toBe(controller.signal);
  const reason = new Error('Preparation cancelled.');

  controller.abort(reason);
  expect(receivedSignal?.aborted).toBe(true);
  expect(receivedSignal?.reason).toBe(reason);
  preparation.resolve(experience);
  await expect(activation).rejects.toBe(reason);
  expect(experience.activate).not.toHaveBeenCalled();
  expect(experience.dispose).toHaveBeenCalledOnce();
});

test('rejects an already cancelled request without starting preparation', async () => {
  const controller = new AbortController();
  const reason = new Error('Preparation cancelled.');
  controller.abort(reason);
  const coordinator = new ExperienceCoordinator({
    ...createPreparationOptions(),
    signal: controller.signal,
  });
  const prepareExperience = vi.fn(async () => createExperience());

  await expect(coordinator.prepareAndActivateExperience(prepareExperience)).rejects.toBe(reason);
  expect(prepareExperience).not.toHaveBeenCalled();
});

test('releases a failed activation and retains both causes if cleanup fails too', async () => {
  const coordinator = new ExperienceCoordinator(createPreparationOptions());
  const experience = createExperience();
  const activationCause = new Error('Activation failed.');
  const cleanupCause = new Error('Cleanup failed.');
  vi.mocked(experience.activate).mockImplementationOnce(() => {
    throw activationCause;
  });

  await expect(coordinator.prepareAndActivateExperience(async () => experience)).rejects.toBe(
    activationCause
  );
  expect(experience.dispose).toHaveBeenCalledOnce();

  vi.mocked(experience.activate).mockImplementationOnce(() => {
    throw activationCause;
  });
  vi.mocked(experience.dispose).mockImplementationOnce(() => {
    throw cleanupCause;
  });
  await expect(
    coordinator.prepareAndActivateExperience(async () => experience)
  ).rejects.toMatchObject({
    code: EXPERIENCE_COORDINATOR_ERROR_CODES.PREPARATION_AND_CLEANUP_FAILED,
    cause: { errors: [activationCause, cleanupCause] },
  });
});
