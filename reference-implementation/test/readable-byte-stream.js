const test = require('tape-catch');

test('ReadableStream with byte source can be constructed with no errors', t => {
  t.doesNotThrow(
      () => new ReadableStream({ pullInto() {} }),
      'ReadableStream with byte source constructed with an empty underlying byte source object as parameter');
  t.end();
});

test('ReadableStream with byte source: Construct and expect start and pull being called', t => {
  let startCalled = false;

  const stream = new ReadableStream({
    start() {
      startCalled = true;
    },
    pull() {
      t.ok(startCalled);
      t.end();
    },
    pullInto() {
      t.fail('pullInto must not be called');
      t.end();
    }
  });
});

test('ReadableStream with byte source: No automatic pull call if start doesn\'t finish', t => {
  let pullCount = 0;
  let checkedNoPull = false;

  let resolveStartPromise;

  const stream = new ReadableStream({
    start() {
      return new Promise((resolve) => {
        resolveStartPromise = resolve;
      });
    },
    pull() {
      ++pullCount;

      if (checkedNoPull) {
        t.end();
      }
    },
    pullInto() {
      t.fail('pullInto must not be called');
      t.end();
    }
  });

  Promise.resolve().then(() => {
    t.equals(pullCount, 0);
    checkedNoPull = true;
    resolveStartPromise();
  });
});

test('ReadableStream with byte source: Construct with highWaterMark of 0', t => {
  const stream = new ReadableStream({
    pull() {
      t.fail('pull must not be called');
      t.end();
    },
    pullInto() {
      t.fail('pullInto must not be called');
      t.end();
    }
  }, {
    highWaterMark: 0
  });

  Promise.resolve().then(() => {
    t.end();
  });
});

test('ReadableStream with byte source: getReader(), then releaseLock()', t => {
  const stream = new ReadableStream({
    pullInto() {
      t.fail('pullInto must not be called');
      t.end();
    }
  });

  const reader = stream.getReader();
  reader.releaseLock();

  reader.closed.then(() => {
    t.fail('closed must be rejected');
    t.end();
  }).catch(e => {
    t.end();
  });
});

test('ReadableStream with byte source: getByobReader(), then releaseLock()', t => {
  const stream = new ReadableStream({
    pullInto() {
      t.fail('pullInto must not be called');
      t.end();
    }
  });

  const reader = stream.getByobReader();
  reader.releaseLock();

  reader.closed.then(() => {
    t.fail('closed must be rejected');
    t.end();
  }).catch(e => {
    t.end();
  });
});

test('ReadableStream with byte source: Test that closing a stream does not release a reader automatically', t => {
  const stream = new ReadableStream({
    start(c) {
      c.close();
    },
    pull() {
      t.fail('pull must not be called');
      t.end();
    },
    pullInto() {
      t.fail('pullInto must not be called');
      t.end();
    }
  });

  const reader = stream.getReader();

  reader.closed.then(() => {
    try {
      stream.getReader();
    } catch(e) {
      t.equals(e.constructor, TypeError);
      t.end();
      return;
    }

    t.fail('getReader() must fail');
    t.end();
  }).catch(e => {
    t.fail(e);
    t.end();
  });
});

test('ReadableStream with byte source: Test that closing a stream does not release a BYOB reader automatically', t => {
  const stream = new ReadableStream({
    start(c) {
      c.close();
    },
    pull() {
      t.fail('pull must not be called');
      t.end();
    },
    pullInto() {
      t.fail('pullInto must not be called');
      t.end();
    }
  });

  const reader = stream.getByobReader();

  reader.closed.then(() => {
    try {
      stream.getByobReader();
    } catch(e) {
      t.equals(e.constructor, TypeError);
      t.end();
      return;
    }

    t.fail('getByobReader() must fail');
    t.end();
  }).catch(e => {
    t.fail(e);
    t.end();
  });
});

test('ReadableStream with byte source: Test that erroring a stream does not release a reader automatically', t => {
  const passedError = new TypeError('foo');

  const stream = new ReadableStream({
    start(c) {
      c.error(passedError);
    },
    pull() {
      t.fail('pull must not be called');
      t.end();
    },
    pullInto() {
      t.fail('pullInto must not be called');
      t.end();
    }
  });

  const reader = stream.getReader();

  reader.closed.then(() => {
    t.fail('closed must be rejected');
    t.end();
  }, e => {
    t.equals(e, passedError);

    try {
      stream.getReader();
    } catch(e) {
      t.equals(e.constructor, TypeError);
      t.end();
      return;
    }

    t.fail('getReader() must fail');
    t.end();
  });
});

test('ReadableStream with byte source: Test that erroring a stream does not release a BYOB reader automatically',
     t => {
  const passedError = new TypeError('foo');

  const stream = new ReadableStream({
    start(c) {
      c.error(passedError);
    },
    pull() {
      t.fail('pull must not be called');
      t.end();
    },
    pullInto() {
      t.fail('pullInto must not be called');
      t.end();
    }
  });

  const reader = stream.getByobReader();

  reader.closed.then(() => {
    t.fail('closed must be rejected');
    t.end();
  }, e => {
    t.equals(e, passedError);

    try {
      stream.getByobReader();
    } catch(e) {
      t.equals(e.constructor, TypeError);
      t.end();
      return;
    }

    t.fail('getByobReader() must fail');
    t.end();
  });
});

test('ReadableStream with byte source: releaseLock() on ReadableStreamReader with pending read() must throw', t => {
  const stream = new ReadableStream({
    pullInto() {
      t.fail('pullInto must not be called');
      t.end();
    }
  });

  const reader = stream.getReader();
  reader.read();
  try {
    reader.releaseLock();
  } catch(e) {
    t.equals(e.constructor, TypeError);

    t.end();

    return;
  }

  t.fail('reader.releaseLock() didn\'t throw');
  t.end();
});

test('ReadableStream with byte source: enqueue(), getReader(), then read()', t => {
  const stream = new ReadableStream({
    start(c) {
      c.enqueue(new Uint8Array(16));
    },
    pullInto() {
      t.fail('pullInto must not be called');
      t.end();
    }
  });

  const reader = stream.getReader();

  reader.read().then(result => {
    t.equals(result.done, false);

    const view = result.value;
    t.equals(view.constructor, Uint8Array);
    t.equals(view.buffer.byteLength, 16);
    t.equals(view.byteOffset, 0);
    t.equals(view.byteLength, 16);

    t.end();
  });
});

test('ReadableStream with byte source: Push source that doesn\'t understand pull signal', t => {
  let controller;

  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
    pullInto() {
    }
  });

  const reader = stream.getReader();

  reader.read().then(result => {
    t.equals(result.done, false);

    const view = result.value;
    t.equals(view.constructor, Uint8Array);
    t.equals(view.buffer.byteLength, 1);
    t.equals(view.byteOffset, 0);
    t.equals(view.byteLength, 1);

    t.end();
  });

  controller.enqueue(new Uint8Array(1));
});

test('ReadableStream with byte source: pull() function is not callable', t => {
  const stream = new ReadableStream({
    pull: 'foo',
    pullInto() {
      t.fail('pullInto must not be called');
      t.end();
    }
  });

  const reader = stream.getReader();

  reader.read().then(result => {
    t.fail('read() must fail');
    t.end();
  }).catch(e => {
    t.equals(e.constructor, TypeError);
    t.end();
  });
});

test('ReadableStream with byte source: pull() function is not callable', t => {
  const stream = new ReadableStream({
    pull() {
      t.fail('pullInto must not be called');
      t.end();
    },
    pullInto: 'foo'
  });

  const reader = stream.getByobReader();

  reader.read(new Uint8Array(1)).then(result => {
    t.fail('read() must fail');
    t.end();
  }).catch(e => {
    t.equals(e.constructor, TypeError);
    t.end();
  });
});

test('ReadableStream with byte source: enqueue() with Uint16Array, getReader(), then read()', t => {
  const stream = new ReadableStream({
    start(c) {
      c.enqueue(new Uint16Array(16));
    },
    pullInto() {
      t.fail('pullInto must not be called');
      t.end();
    }
  });

  const reader = stream.getReader();

  reader.read().then(result => {
    t.equals(result.done, false);

    const view = result.value;
    t.equals(view.constructor, Uint8Array);
    t.equals(view.buffer.byteLength, 32);
    t.equals(view.byteOffset, 0);
    t.equals(view.byteLength, 32);

    t.end();
  });
});

test('ReadableStream with byte source: enqueue(), read(view) partially, then read()', t => {
  let pullCount = 0;

  const stream = new ReadableStream({
    start(c) {
      const view = new Uint8Array(16);
      view[0] = 0x01;
      view[8] = 0x02;
      c.enqueue(view);
    },
    pull() {
      ++pullCount;
    },
    pullInto() {
      t.fail('pullInto must not be called');
      t.end();
    }
  });

  const byobReader = stream.getByobReader();

  byobReader.read(new Uint8Array(8)).then(result => {
    t.equals(result.done, false, 'done');

    const view = result.value;
    t.equals(view.constructor, Uint8Array, 'value.constructor');
    t.equals(view.buffer.byteLength, 8, 'value.buffer.byteLength');
    t.equals(view.byteOffset, 0, 'value.byteOffset');
    t.equals(view.byteLength, 8, 'value.byteLength');
    t.equals(view[0], 0x01);

    byobReader.releaseLock();

    const reader = stream.getReader();

    return reader.read();
  }).then(result => {
    t.equals(result.done, false, 'done');

    const view = result.value;
    t.equals(view.constructor, Uint8Array, 'value.constructor');
    t.equals(view.buffer.byteLength, 16, 'value.buffer.byteLength');
    t.equals(view.byteOffset, 8, 'value.byteOffset');
    t.equals(view.byteLength, 8, 'value.byteLength');
    t.equals(view[0], 0x02);

    t.equals(pullCount, 1);

    t.end();
  }).catch(e => {
    t.fail(e);
    t.end();
  });
});

test('ReadableStream with byte source: getReader(), enqueue(), close(), then read()', t => {
  let controller;

  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
    pull() {
      t.fail('pull must not be called');
      t.end();
    },
    pullInto() {
      t.fail('pullInto must not be called');
      t.end();
    }
  });

  const reader = stream.getReader();

  controller.enqueue(new Uint8Array(16));
  controller.close();

  reader.read().then(result => {
    t.equals(result.done, false, 'done');

    const view = result.value;
    t.equals(view.byteOffset, 0, 'byteOffset');
    t.equals(view.byteLength, 16, 'byteLength');

    return reader.read();
  }).then(result => {
    t.equals(result.done, true, 'done');
    t.equals(result.value, undefined, 'value');

    t.end();
  }).catch(e => {
    t.fail(e);
    t.end();
  });
});

test('ReadableStream with byte source: enqueue(), close(), getReader(), then read()', t => {
  const stream = new ReadableStream({
    start(c) {
      c.enqueue(new Uint8Array(16));
      c.close();
    },
    pull() {
      t.fail('pull must not be called');
      t.end();
    },
    pullInto() {
      t.fail('pullInto must not be called');
      t.end();
    }
  });

  const reader = stream.getReader();

  reader.read().then(result => {
    t.equals(result.done, false, 'done');

    const view = result.value;
    t.equals(view.byteOffset, 0, 'byteOffset');
    t.equals(view.byteLength, 16, 'byteLength');

    return reader.read();
  }).then(result => {
    t.equals(result.done, true, 'done');
    t.equals(result.value, undefined, 'value');

    t.end();
  }).catch(e => {
    t.fail(e);
    t.end();
  });
});

test('ReadableStream with byte source: Respond to pull() by enqueue()', t => {
  let controller;

  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
    pull() {
      controller.enqueue(new Uint8Array(16));
    },
    pullInto() {
      t.fail('pullInto must not be called');
      t.end();
    }
  });

  const reader = stream.getReader();

  reader.read().then(result => {
    t.equals(result.done, false, 'done');
    t.equals(result.value.byteLength, 16, 'byteLength');

    t.end();
  }).catch(e => {
    t.fail(e);
    t.end();
  });
});

test('ReadableStream with byte source: Respond to pull() by enqueue() asynchronously', t => {
  let pullCount = 0;

  let controller;

  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
    pull() {
      console.error(pullCount);
      if (pullCount === 0) {
        t.equals(controller.desiredSize, 1);
        controller.enqueue(new Uint8Array(1));
        t.equals(controller.desiredSize, 1);
        controller.enqueue(new Uint8Array(1));
        t.equals(controller.desiredSize, 1);
      } else {
        t.fail('Too many pull calls');
        t.end();
        return;
      }

      ++pullCount;
    },
    pullInto() {
      t.fail('pullInto must not be called');
      t.end();
    }
  });

  const reader = stream.getReader();

  const p0 = reader.read();
  const p1 = reader.read();
  const p2 = reader.read();

  // Respond to the first pull call.
  controller.enqueue(new Uint8Array(1));

  t.equals(pullCount, 0);

  Promise.all([p0, p1, p2]).then(result => {
    t.equals(pullCount, 1);

    t.equals(result[0].done, false, 'done');
    t.equals(result[0].value.byteLength, 1, 'byteLength');
    t.equals(result[1].done, false, 'done');
    t.equals(result[1].value.byteLength, 1, 'byteLength');
    t.equals(result[2].done, false, 'done');
    t.equals(result[2].value.byteLength, 1, 'byteLength');

    t.end();
  }).catch(e => {
    t.fail(e);
    t.end();
  });
});

test('ReadableStream with byte source: Responding to pull() by respond() should throw and error the stream', t => {
  let controller;

  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
    pull() {
      try {
        controller.respond(1);
      } catch(e) {
        t.equals(e.constructor, TypeError, 'pull() shouldn\'t responded by respond()');

        t.end();
        return;
      }

      t.fail('respond() didn\'t throw');
      t.end();
    },
    pullInto() {
      t.fail('pullInto must not be called');
      t.end();
    }
  });

  const reader = stream.getReader();

  reader.read().catch(e => {
    t.fail(e);
    t.end();
  });
});

test('ReadableStream with byte source: read(view), then respond() with too big value', t => {
  let controller;

  let pullCount = 0;

  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
    pullInto() {
      if (pullCount === 0) {
        ++pullCount;

        try {
          controller.respond(2);
        } catch(e) {
          t.equals(e.constructor, RangeError);

          t.end();
          return;
        }

        t.fail('respond() didn\'t throw');
        t.end();
      }

      ++pullCount;
    }
  });

  const reader = stream.getByobReader();

  reader.read(new Uint8Array(1)).catch(e => {
    t.fail(e);
    t.end();
  });
});

test('ReadableStream with byte source: respond(3) to read(view) with 2 element Uint16Array enqueues the 1 byte ' +
    'remainder', t => {
  let pullIntoCount = 0;

  let controller;

  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
    pullInto(view) {
      if (pullIntoCount > 1) {
        t.fail('Too many pullInt calls');
        t.end();
        return;
      }

      ++pullIntoCount;

      t.equals(view.constructor, Uint8Array);
      t.equals(view.buffer.byteLength, 4);

      t.equals(view.byteOffset, 0);
      t.equals(view.byteLength, 4);

      view[0] = 0x01;
      view[1] = 0x02;
      view[2] = 0x03;

      controller.respond(3);
    }
  });

  const reader = stream.getByobReader();

  reader.read(new Uint16Array(2)).then(result => {
    t.equals(result.done, false, 'done');

    const view = result.value;
    t.equals(view.byteOffset, 0, 'byteOffset');
    t.equals(view.byteLength, 2, 'byteLength');

    t.equals(view[0], 0x0201);

    return reader.read(new Uint8Array(1));
  }).then(result => {
    t.equals(result.done, false, 'done');

    const view = result.value;
    t.equals(view.byteOffset, 0, 'byteOffset');
    t.equals(view.byteLength, 1, 'byteLength');

    t.equals(view[0], 0x03);

    t.end();
  }).catch(e => {
    t.fail(e);
    t.end();
  });
});

test('ReadableStream with byte source: enqueue(), getByobReader(), then read(view)', t => {
  const stream = new ReadableStream({
    start(c) {
      const view = new Uint8Array(16);
      view[15] = 0x01;
      c.enqueue(view);
    },
    pullInto() {
      t.fail('pullInto must not be called');
      t.end();
    }
  });

  const reader = stream.getByobReader();

  reader.read(new Uint8Array(16)).then(result => {
    t.equals(result.done, false);

    const view = result.value;
    t.equals(view.byteOffset, 0);
    t.equals(view.byteLength, 16);
    t.equals(view[15], 0x01);

    t.end();
  }).catch(e => {
    t.fail(e);
    t.end();
  });
});

test('ReadableStream with byte source: enqueue(), getReader(), then cancel()', t => {
  let cancelCount = 0;

  const passedReason = new TypeError('foo');

  const stream = new ReadableStream({
    start(c) {
      c.enqueue(new Uint8Array(16));
    },
    pull() {
      t.fail('pull must not be called');
      t.end();
    },
    pullInto() {
      t.fail('pullInto must not be called');
      t.end();
    },
    cancel(reason) {
      if (cancelCount === 0) {
        t.equals(reason, passedReason);
      } else {
        t.fail('Too many cancel calls');
        t.end();
        return;
      }

      ++cancelCount;
    }
  });

  const reader = stream.getReader();

  reader.cancel(passedReason).then(result => {
    t.equals(result, undefined);
    t.equals(cancelCount, 1);

    t.end();
  }).catch(e => {
    t.fail(e);
    t.end();
  });
});

test('ReadableStream with byte source: enqueue(), getByobReader(), then cancel()', t => {
  let cancelCount = 0;

  const passedReason = new TypeError('foo');

  const stream = new ReadableStream({
    start(c) {
      c.enqueue(new Uint8Array(16));
    },
    pull() {
      t.fail('pull must not be called');
      t.end();
    },
    pullInto() {
      t.fail('pullInto must not be called');
      t.end();
    },
    cancel(reason) {
      if (cancelCount === 0) {
        t.equals(reason, passedReason);
      } else {
        t.fail('Too many cancel calls');
        t.end();
        return;
      }

      ++cancelCount;
    }
  });

  const reader = stream.getByobReader();

  reader.cancel(passedReason).then(result => {
    t.equals(result, undefined);
    t.equals(cancelCount, 1);

    t.end();
  }).catch(e => {
    t.fail(e);
    t.end();
  });
});

test('ReadableStream with byte source: getByobReader(), read(view), then cancel()', t => {
  let pullIntoCount = 0;
  let cancelCount = 0;

  const passedReason = new TypeError('foo');

  let controller;

  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
    pull() {
      t.fail('pull must not be called');
      t.end();
    },
    pullInto() {
      if (pullIntoCount > 0) {
        t.fail('Too many pullInto calls');
        t.end();
        return;
      }

      ++pullIntoCount;
    },
    cancel(reason) {
      if (cancelCount === 0) {
        t.equals(reason, passedReason);

        controller.respond(0);
      } else {
        t.fail('Too many cancel calls');
        t.end();
        return;
      }

      ++cancelCount;

      return 'bar';
    }
  });

  const reader = stream.getByobReader();

  const p0 = reader.read(new Uint8Array(1)).then(result => {
    t.equals(result.done, true);
  });

  const p1 = reader.cancel(passedReason).then(result => {
    t.equals(result, undefined);
    t.equals(cancelCount, 1);
  });

  Promise.all([p0, p1]).then(() => {
    t.end();
  }).catch(e => {
    t.fail(e);
    t.end();
  });
});

test('ReadableStream with byte source: cancel() with partially filled pending pullInto() request', t => {
  let pullIntoCount = 0;

  let controller;

  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
    pullInto() {
      if (pullIntoCount === 0) {
        controller.enqueue(new Uint8Array(1));
      } else if (pullIntoCount === 1) {
        // Do nothing
      } else {
        t.fail('Too many pullInto calls');
        t.end();
      }

      ++pullIntoCount;
    }
  });

  const reader = stream.getByobReader();

  reader.read(new Uint16Array(1)).then(result => {
    t.equals(result.done, true);
    t.equals(result.value.constructor, Uint16Array);
    t.end();
  }).catch(e => {
    t.fail(e);
    t.end();
  });
  reader.cancel();

  t.equals(pullIntoCount, 0);

  // Tell that the buffer given via pullInto() is returned.
  controller.respond(0);
});

test('ReadableStream with byte source: enqueue(), getReader(), then read(view) where view.buffer is not fully ' +
    'covered by view', t => {
  const stream = new ReadableStream({
    start(c) {
      const view = new Uint8Array(8);
      view[7] = 0x01;
      c.enqueue(view);
    },
    pullInto() {
      t.fail('pullInto must not be called');
      t.end();
    }
  });

  const reader = stream.getByobReader();

  const buffer = new ArrayBuffer(16);

  reader.read(new Uint8Array(buffer, 8, 8)).then(result => {
    t.equals(result.done, false);

    const view = result.value;
    t.equals(view.constructor, Uint8Array);
    t.equals(view.buffer.byteLength, 16)
    t.equals(view.byteOffset, 8);
    t.equals(view.byteLength, 8);
    t.equals(view[7], 0x01);

    t.end();
  }).catch(e => {
    t.fail(e);
    t.end();
  });
});

test('ReadableStream with byte source: Multiple enqueue(), getReader(), then read(view)', t => {
  const stream = new ReadableStream({
    start(c) {
      let view;

      view = new Uint8Array(16);
      view[15] = 123;
      c.enqueue(view);

      view = new Uint8Array(8);
      view[7] = 111;
      c.enqueue(view);
    },
    pullInto() {
      t.fail('pullInto must not be called');
      t.end();
    }
  });

  const reader = stream.getByobReader();

  reader.read(new Uint8Array(24)).then(result => {
    t.equals(result.done, false, 'done');

    const view = result.value;
    t.equals(view.byteOffset, 0, 'byteOffset');
    t.equals(view.byteLength, 24, 'byteLength');
    t.equals(view[15], 123, 'Contents are set from the first chunk');
    t.equals(view[23], 111, 'Contents are set from the second chunk');

    t.end();
  }).catch(e => {
    t.fail(e);
    t.end();
  });
});

test('ReadableStream with byte source: enqueue(), getReader(), then read(view) with a bigger view', t => {
  const stream = new ReadableStream({
    start(c) {
      const view = new Uint8Array(16);
      view[15] = 0x01;
      c.enqueue(view);
    },
    pullInto() {
      t.fail('pullInto must not be called');
      t.end();
    }
  });

  const reader = stream.getByobReader();

  reader.read(new Uint8Array(24)).then(result => {
    t.equals(result.done, false);

    const view = result.value;
    t.equals(view.byteOffset, 0);
    t.equals(view.byteLength, 16);
    t.equals(view[15], 0x01);

    t.end();
  }).catch(e => {
    t.fail(e);
    t.end();
  });
});

test('ReadableStream with byte source: enqueue(), getReader(), then read(view) with a smaller views', t => {
  const stream = new ReadableStream({
    start(c) {
      const view = new Uint8Array(16);
      view[7] = 0x01;
      view[15] = 0x02;
      c.enqueue(view);
    },
    pullInto() {
      t.fail('pullInto must not be called');
      t.end();
    }
  });

  const reader = stream.getByobReader();

  reader.read(new Uint8Array(8)).then(result => {
    t.equals(result.done, false, 'done');

    const view = result.value;
    t.equals(view.byteOffset, 0);
    t.equals(view.byteLength, 8);
    t.equals(view[7], 0x01);

    return reader.read(new Uint8Array(8));
  }).then(result => {
    t.equals(result.done, false, 'done');

    const view = result.value;
    t.equals(view.byteOffset, 0);
    t.equals(view.byteLength, 8);
    t.equals(view[7], 0x02);

    t.end();
  }).catch(e => {
    t.fail(e);
    t.end();
  });
});

test('ReadableStream with byte source: enqueue() 1 byte, getReader(), then read(view) with Uint16Array', t => {
  let controller;

  const stream = new ReadableStream({
    start(c) {
      const view = new Uint8Array(1);
      view[0] = 0xff;
      c.enqueue(view);

      controller = c;
    },
    pullInto(view) {
      t.equals(view.constructor, Uint8Array);
      t.equals(view.buffer.byteLength, 2);

      t.equals(view.byteOffset, 1);
      t.equals(view.byteLength, 1);

      view[0] = 0xaa;
      controller.respond(1);
    }
  });

  const reader = stream.getByobReader();

  reader.read(new Uint16Array(1)).then(result => {
    t.equals(result.done, false);

    const view = result.value;
    t.equals(view.byteOffset, 0);
    t.equals(view.byteLength, 2);
    t.equals(view[0], 0xaaff);

    t.end();
  }).catch(e => {
    t.fail(e);
    t.end();
  });
});

test('ReadableStream with byte source: enqueue() 3 byte, getReader(), then read(view) with 2-element Uint16Array',
     t => {
  let pullIntoCount = 0;

  let controller;

  const stream = new ReadableStream({
    start(c) {
      const view = new Uint8Array(3);
      view[0] = 0x01;
      view[2] = 0x02;
      c.enqueue(view);

      controller = c;
    },
    pullInto(view) {
      if (pullIntoCount === 0) {
        t.equals(view.constructor, Uint8Array);
        t.equals(view.buffer.byteLength, 2);
        t.equals(view.byteOffset, 1);
        t.equals(view.byteLength, 1);

        view[0] = 0x03;
        controller.respond(1);
      } else {
        t.fail('Too many pullInto calls');
        t.end();
      }

      ++pullIntoCount;
    }
  });

  const reader = stream.getByobReader();

  reader.read(new Uint16Array(2)).then(result => {
    t.equals(result.done, false, 'done');

    const view = result.value;
    t.equals(view.constructor, Uint16Array, 'constructor');
    t.equals(view.buffer.byteLength, 4, 'buffer.byteLength');
    t.equals(view.byteOffset, 0, 'byteOffset');
    t.equals(view.byteLength, 2, 'byteLength');
    t.equals(view[0], 0x0001, 'Contents are set');

    const p = reader.read(new Uint16Array(1));

    t.equals(pullIntoCount, 1);

    return p;
  }).then(result => {
    t.equals(result.done, false, 'done');

    const view = result.value;
    t.equals(view.buffer.byteLength, 2, 'buffer.byteLength');
    t.equals(view.byteOffset, 0, 'byteOffset');
    t.equals(view.byteLength, 2, 'byteLength');
    t.equals(view[0], 0x0302, 'Contents are set');

    t.end();
  }).catch(e => {
    t.fail(e);
    t.end();
  });

  t.equals(pullIntoCount, 0);
});

test('ReadableStream with byte source: read(view) with Uint16Array on close()-d stream with 1 byte enqueue()-d must ' +
    'fail', t => {
  const stream = new ReadableStream({
    start(c) {
      const view = new Uint8Array(1);
      view[0] = 0xff;
      c.enqueue(view);
      c.close();
    },
    pull() {
      t.fail('pull must not be called');
      t.end();
    },
    pullInto() {
      t.fail('pullInto must not be called');
      t.end();
    }
  });

  const reader = stream.getByobReader();

  reader.read(new Uint16Array(1)).then(result => {
    t.fail('read(view) must fail');
    t.end();
  }).catch(e => {
    t.equals(e.constructor, TypeError);
    reader.closed.catch(e => {
      t.equals(e.constructor, TypeError);
      t.end();
    });
  });
});

test('ReadableStream with byte source: A stream must be errored if close()-d before fulfilling read(view) with ' +
     'Uint16Array', t => {
  let pullIntoCount = 0;

  let controller;

  const stream = new ReadableStream({
    start(c) {
      const view = new Uint8Array(1);
      view[0] = 0xff;
      c.enqueue(view);

      controller = c;
    },
    pull() {
      t.fail('pull must not be called');
      t.end();
    },
    pullInto(view) {
      if (pullIntoCount === 0) {
        t.equals(view.constructor, Uint8Array);
        t.equals(view.buffer.byteLength, 2);

        t.equals(view.byteOffset, 1);
        t.equals(view.byteLength, 1);
      } else {
        t.fail('Too many pullInto calls');
        t.end();
        return;
      }

      ++pullIntoCount;
    }
  });

  const reader = stream.getByobReader();

  reader.read(new Uint16Array(1)).then(result => {
    t.fail('read(view) must fail');
    t.end();
  }).catch(e => {
    t.equals(e.constructor, TypeError);
    reader.closed.catch(e => {
      t.equals(e.constructor, TypeError);

      // pullInto is never called since the startPromise has not yet been handled.
      t.equals(pullIntoCount, 0);

      t.end();
    });
  });

  try {
    controller.close();
  } catch(e) {
    t.equals(e.constructor, TypeError);
    return;
  }

  t.fail('controller.close() didn\'t throw');
  t.end();
});

test('ReadableStream with byte source: Throw if close()-ed more than once', t => {
  let controller;

  const stream = new ReadableStream({
    start(c) {
      const view = new Uint8Array(1);
      controller = c;
    },
    pull() {},
    pullInto() {}
  });

  // Enqueue a chunk so that the stream doesn't get closed. This is to check duplicate close() calls are rejected
  // even if the stream has not yet entered the closed state.
  const view = new Uint8Array(1);
  controller.enqueue(view);
  controller.close();

  try {
    controller.close();
  } catch(e) {
    t.equals(e.constructor, TypeError);
    t.end();
    return;
  }

  t.fail('controller.close() didn\'t throw');
  t.end();
});

test('ReadableStream with byte source: Throw on enqueue() after close()', t => {
  let controller;

  const stream = new ReadableStream({
    start(c) {
      const view = new Uint8Array(1);
      controller = c;
    },
    pull() {},
    pullInto() {}
  });

  // Enqueue a chunk so that the stream doesn't get closed. This is to check enqueue() after close() is  rejected
  // even if the stream has not yet entered the closed state.
  const view = new Uint8Array(1);
  controller.enqueue(view);
  controller.close();

  try {
    controller.enqueue(view);
  } catch(e) {
    t.equals(e.constructor, TypeError);
    t.end();
    return;
  }

  t.fail('controller.close() didn\'t throw');
  t.end();
});

test('ReadableStream with byte source: read(view), then respond() and close() in pullInto()', t => {
  let controller;

  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
    pull() {
      t.fail('pull must not be called');
      t.end();
    },
    pullInto(view) {
      t.equals(view.constructor, Uint8Array);
      t.equals(view.buffer.byteLength, 16);

      t.equals(view.byteOffset, 0);
      t.equals(view.byteLength, 16);

      view[15] = 0x01;
      controller.respond(16);
      controller.close();
    }
  });

  const reader = stream.getByobReader();

  reader.read(new Uint8Array(16)).then(result => {
    t.equals(result.done, false);

    const view = result.value;
    t.equals(view.byteOffset, 0);
    t.equals(view.byteLength, 16);
    t.equals(view[15], 0x01);

    return reader.read(new Uint8Array(16));
  }).then(result => {
    t.equals(result.done, true);

    const view = result.value;
    t.equals(view.byteOffset, 0);
    t.equals(view.byteLength, 0);

    t.end();
  }).catch(e => {
    t.fail(e);
    t.end();
  });
});

test('ReadableStream with byte source: read(view) with Uint32Array, then fill it by multiple respond() calls', t => {
  let pullIntoCount = 0;

  let controller;

  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
    pullInto(view) {
      if (pullIntoCount < 4) {
        t.equals(view.constructor, Uint8Array);
        t.equals(view.buffer.byteLength, 4);

        t.equals(view.byteOffset, pullIntoCount);
        t.equals(view.byteLength, 4 - pullIntoCount);

        view[0] = 0x01;
        controller.respond(1);
      } else {
        t.fail('Too many pullInto() calls');
        t.end();
      }

      ++pullIntoCount;
    }
  });

  const reader = stream.getByobReader();

  reader.read(new Uint32Array(1)).then(result => {
    t.equals(result.done, false);

    const view = result.value;
    t.equals(view.byteOffset, 0);
    t.equals(view.byteLength, 4);
    t.equals(view[0], 0x01010101);

    t.end();
  }).catch(e => {
    t.fail(e);
    t.end();
  });
});

test('ReadableStream with byte source: read() twice, then enqueue() twice', t => {
  let pullCount = 0;

  let controller;

  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
    pull() {
      if (pullCount > 1) {
        t.fail('Too many pullInto calls');
        t.end();
      }

      ++pullCount;
    },
    pullInto() {
      t.fail('pullInto must not be called');
      t.end();
    }
  });

  const reader = stream.getReader();

  const p0 = reader.read().then(result => {
    t.equals(pullCount, 1);

    controller.enqueue(new Uint8Array(2));

    // Since the queue has data no less than HWM, no more pull.
    t.equals(pullCount, 1);

    t.equals(result.done, false);

    const view = result.value;
    t.equals(view.constructor, Uint8Array);
    t.equals(view.buffer.byteLength, 1);
    t.equals(view.byteOffset, 0);
    t.equals(view.byteLength, 1);
  });

  t.equals(pullCount, 0, 'No pull should have been made since the startPromise has not yet been handled');

  const p1 = reader.read().then(result => {
    t.equals(pullCount, 1);

    t.equals(result.done, false);

    const view = result.value;
    t.equals(view.constructor, Uint8Array);
    t.equals(view.buffer.byteLength, 2);
    t.equals(view.byteOffset, 0);
    t.equals(view.byteLength, 2);
  });

  Promise.all([p0, p1]).then(() => {
    t.end();
  }).catch(e => {
    t.fail(e);
    t.end();
  })

  t.equals(pullCount, 0, 'No pull should have been made since the startPromise has not yet been handled');

  controller.enqueue(new Uint8Array(1));

  t.equals(pullCount, 0, 'No pull should have been made since the startPromise has not yet been handled');
});

test('ReadableStream with byte source: Multiple read(view), close() and respond()', t => {
  let pullIntoCount = 0;

  let controller;

  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
    pull() {
      t.fail('pull must not be called');
      t.end();
    },
    pullInto(view) {
      if (pullIntoCount === 0) {
        t.equals(view.constructor, Uint8Array);
        t.equals(view.buffer.byteLength, 16);

        t.equals(view.byteOffset, 0);
        t.equals(view.byteLength, 16);
      } else {
        t.fail('Too many pullInto calls');
        t.end();
      }

      ++pullIntoCount;
    }
  });

  const reader = stream.getByobReader();

  const p0 = reader.read(new Uint8Array(16)).then(result => {
    t.equals(result.done, true, '1st read: done');

    const view = result.value;
    t.equals(view.buffer.byteLength, 16, '1st read: buffer.byteLength');
    t.equals(view.byteOffset, 0, '1st read: byteOffset');
    t.equals(view.byteLength, 0, '1st read: byteLength');
  });

  const p1 = reader.read(new Uint8Array(32)).then(result => {
    t.equals(result.done, true, '2nd read: done');

    const view = result.value;
    t.equals(view.buffer.byteLength, 32, '2nd read: buffer.byteLength');
    t.equals(view.byteOffset, 0, '2nd read: byteOffset');
    t.equals(view.byteLength, 0, '2nd read: byteLength');
  });

  Promise.all([p0, p1]).then(() => {
    t.end();
  }).catch(e => {
    t.fail(e);
    t.end();
  })

  controller.close();
  controller.respond(0);
});

test('ReadableStream with byte source: Multiple read(view), big enqueue()', t => {
  let pullIntoCount = 0;

  let controller;

  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
    pullInto(view) {
      if (pullIntoCount === 0) {
        t.equals(view.constructor, Uint8Array);
        t.equals(view.buffer.byteLength, 16);

        t.equals(view.byteOffset, 0);
        t.equals(view.byteLength, 16);
      } else {
        t.fail();
        t.end();
      }

      ++pullIntoCount;
    }
  });

  const reader = stream.getByobReader();

  const p0 = reader.read(new Uint8Array(16)).then(result => {
    t.equals(result.done, false, '1st read: done');

    const view = result.value;
    t.equals(view.buffer.byteLength, 16, '1st read: buffer.byteLength');
    t.equals(view.byteOffset, 0, '1st read: byteOffset');
    t.equals(view.byteLength, 16, '1st read: byteLength');
  });

  const p1 = reader.read(new Uint8Array(16)).then(result => {
    t.equals(result.done, false, '2nd read: done');

    const view = result.value;
    t.equals(view.buffer.byteLength, 16, '2nd read: buffer.byteLength');
    t.equals(view.byteOffset, 0, '2nd read: byteOffset');
    t.equals(view.byteLength, 8, '2nd read: byteLength');
  });

  Promise.all([p0, p1]).then(() => {
    t.end();
  }).catch(e => {
    t.fail(e);
    t.end();
  })

  controller.enqueue(new Uint8Array(24));
});

test('ReadableStream with byte source: Multiple read(view) and multiple enqueue()', t => {
  let controller;

  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
    pull() {
      t.fail('pull must not be called');
      t.end();
    },
    pullInto() {}
  });

  const reader = stream.getByobReader();

  let bytesRead = 0;

  const pump = () => {
    reader.read(new Uint8Array(7)).then(result => {
      if (result.done) {
        t.equals(bytesRead, 1024);
        t.end();

        return;
      }

      bytesRead += result.value.byteLength;

      pump();
    }).catch(e => {
      t.fail(e);
      t.end();
    });
  };
  pump();

  controller.enqueue(new Uint8Array(512));
  controller.enqueue(new Uint8Array(512));
  controller.close();
});

test('ReadableStream with byte source: read(view) with passing undefined as view must fail', t => {
  const stream = new ReadableStream({
    pullInto() {
      t.fail('pullInto must not be called');
      t.end();
    }
  });

  const reader = stream.getByobReader();

  reader.read().then(result => {
    t.fail('read(view) must fail');
    t.end();
  }).catch(e => {
    t.equals(e.constructor, TypeError);
    t.end();
  });
});

test('ReadableStream with byte source: read(view) with zero-length view must fail', t => {
  const stream = new ReadableStream({
    pullInto() {
      t.fail('pullInto must not be called');
      t.end();
    }
  });

  const reader = stream.getByobReader();

  reader.read(new Uint8Array(0)).then(result => {
    t.fail('read(view) must fail');
    t.end();
  }).catch(e => {
    t.equals(e.constructor, TypeError);
    t.end();
  });
});

test('ReadableStream with byte source: read(view) with passing an empty object as view must fail', t => {
  const stream = new ReadableStream({
    pullInto() {
      t.fail('pullInto must not be called');
      t.end();
    }
  });

  const reader = stream.getByobReader();

  reader.read({}).then(result => {
    t.fail('read(view) must fail');
    t.end();
  }, e => {
    t.equals(e.constructor, TypeError);
    t.end();
  });
});

test('ReadableStream with byte source: Even read(view) with passing ArrayBufferView like object as view must fail',
     t => {
  const stream = new ReadableStream({
    pullInto() {
      t.fail('pullInto must not be called');
      t.end();
    }
  });

  const reader = stream.getByobReader();

  reader.read({buffer: new ArrayBuffer(10), byteOffset: 0, byteLength: 10}).then(result => {
    t.fail('read(view) must fail');
    t.end();
  }, e => {
    t.equals(e.constructor, TypeError);
    t.end();
  });
});

test('ReadableStream with byte source: read() on an errored stream', t => {
  const passedError = new TypeError('foo');

  const stream = new ReadableStream({
    start(c) {
      c.error(passedError);
    },
    pull() {
      t.fail('pull must not be called');
      t.end();
    },
    pullInto() {
      t.fail('pullInto must not be called');
      t.end();
    }
  });

  const reader = stream.getReader();

  reader.read().then(result => {
    t.fail('read() must fail');
    t.end();
  }, e => {
    t.equals(e, passedError);
    t.end();
  });
});

test('ReadableStream with byte source: read(), then error()', t => {
  const passedError = new TypeError('foo');

  let controller;

  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
    pull() {},
    pullInto() {}
  });

  const reader = stream.getReader();

  reader.read().then(result => {
    t.fail('read() must fail');
    t.end();
  }, e => {
    t.equals(e, passedError);
    t.end();
  });

  controller.error(passedError);
});

test('ReadableStream with byte source: read(view) on an errored stream', t => {
  const passedError = new TypeError('foo');

  const stream = new ReadableStream({
    start(c) {
      c.error(passedError);
    },
    pull() {
      t.fail('pull must not be called');
      t.end();
    },
    pullInto() {
      t.fail('pullInto must not be called');
      t.end();
    }
  });

  const reader = stream.getByobReader();

  reader.read(new Uint8Array(1)).then(result => {
    t.fail('read(view) must fail');
    t.end();
  }, e => {
    t.equals(e, passedError);
    t.end();
  });
});

test('ReadableStream with byte source: read(view), then error()', t => {
  const passedError = new TypeError('foo');

  let controller;

  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
    pull() {},
    pullInto() {}
  });

  const reader = stream.getByobReader();

  reader.read(new Uint8Array(1)).then(result => {
    t.fail('read(view) must fail');
    t.end();
  }, e => {
    t.equals(e, passedError);
    t.end();
  });

  controller.error(passedError);
});

test('ReadableStream with byte source: Throwing in pull function must error the stream', t => {
  const testError = new TypeError('foo');

  const stream = new ReadableStream({
    start() {},
    pull() {
      throw testError;
    },
    pullInto() {
      t.fail('pullInto must not be called');
      t.end();
    }
  });

  const reader = stream.getReader();

  reader.read().then(result => {
    t.fail('read(view) must fail');
    t.end();
  }).catch(e => {
    t.equals(e, testError);
    reader.closed.catch(e => {
      t.equals(e, testError);
      t.end();
    });
  });
});

test('ReadableStream with byte source: Throwing in pull function must be ignored if the stream is errored in it',
     t => {
  const passedError = new TypeError('foo');

  let controller;

  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
    pull() {
      controller.error(passedError);
      throw new TypeError('foo');
    },
    pullInto() {
      t.fail('pullInto must not be called');
      t.end();
    }
  });

  const reader = stream.getReader();

  reader.read().then(result => {
    t.fail('read(view) must fail');
    t.end();
  }).catch(e => {
    t.equals(e, passedError);
    reader.closed.catch(e => {
      t.equals(e, passedError);
      t.end();
    });
  });
});

test('ReadableStream with byte source: Throwing in pullInto function must error the stream', t => {
  const testError = new TypeError('foo');

  const stream = new ReadableStream({
    start() {},
    pull() {
      t.fail('pull must not be called');
      t.end();
    },
    pullInto() {
      throw testError;
    }
  });

  const reader = stream.getByobReader();

  reader.read(new Uint8Array(1)).then(result => {
    t.fail('read(view) must fail');
    t.end();
  }).catch(e => {
    t.equals(e, testError);
    reader.closed.catch(e => {
      t.equals(e, testError);
      t.end();
    });
  });
});

test('ReadableStream with byte source: Throwing in pullInto function must be ignored if the stream is errored in it',
     t => {
  const passedError = new TypeError('foo');

  let controller;

  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
    pull() {
      t.fail('pull must not be called');
      t.end();
    },
    pullInto() {
      controller.error(passedError);
      throw new TypeError('foo');
    }
  });

  const reader = stream.getByobReader();

  reader.read(new Uint8Array(1)).then(result => {
    t.fail('read(view) must fail');
    t.end();
  }).catch(e => {
    t.equals(e, passedError);
    reader.closed.catch(e => {
      t.equals(e, passedError);
      t.end();
    });
  });
});
