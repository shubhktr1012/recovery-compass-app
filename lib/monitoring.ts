import { supabase } from '@/lib/supabase';

type MonitoringSource =
  | 'audio'
  | 'error_boundary'
  | 'global_js'
  | 'paywall'
  | 'profile'
  | 'unknown';

interface ErrorContext {
  componentStack?: string | null;
  metadata?: Record<string, unknown> | null;
  source?: MonitoringSource;
}

function toSerializableMetadata(metadata?: Record<string, unknown> | null) {
  if (!metadata) {
    return null;
  }

  try {
    return JSON.parse(JSON.stringify(metadata));
  } catch {
    return {
      serialization_error: true,
    };
  }
}

export async function captureError(error: unknown, context: ErrorContext = {}) {
  const normalizedError =
    error instanceof Error
      ? error
      : new Error(typeof error === 'string' ? error : 'Unknown application error');
  const source = context.source ?? 'unknown';

  console.error(`[monitoring:${source}]`, normalizedError, context.metadata ?? {});

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    const { error: insertError } = await supabase.from('client_error_events').insert({
      user_id: user.id,
      source,
      message: normalizedError.message,
      stack: normalizedError.stack ?? null,
      component_stack: context.componentStack ?? null,
      metadata: toSerializableMetadata(context.metadata),
    });

    if (insertError) {
      throw insertError;
    }
  } catch (reportingError) {
    console.error('Failed to report client error event', reportingError);
  }
}

export function installGlobalErrorHandler() {
  const errorUtils = (
    global as typeof globalThis & {
      ErrorUtils?: {
        getGlobalHandler?: () => (error: Error, isFatal?: boolean) => void;
        setGlobalHandler?: (handler: (error: Error, isFatal?: boolean) => void) => void;
      };
    }
  ).ErrorUtils;

  if (!errorUtils?.getGlobalHandler || !errorUtils?.setGlobalHandler) {
    return () => {};
  }

  const previousHandler = errorUtils.getGlobalHandler();

  errorUtils.setGlobalHandler((error, isFatal) => {
    void captureError(error, {
      source: 'global_js',
      metadata: {
        isFatal: Boolean(isFatal),
      },
    });

    previousHandler?.(error, isFatal);
  });

  return () => {
    if (previousHandler) {
      errorUtils.setGlobalHandler?.(previousHandler);
    }
  };
}
