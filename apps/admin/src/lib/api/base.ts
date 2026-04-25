import ky, { Options, ResponsePromise } from 'ky';

const config = window?.flexaUnsubscribe || {
  rest_url: '/wp-json/',
  rest_nonce: '',
  rest_base: 'flexa-unsubscribe/v1',
  plugin_url: '',
};

const _ky = ky.create({
  prefixUrl: config.rest_url,
  headers: {
    'X-WP-Nonce': config.rest_nonce,
  },
  hooks: {
    afterResponse: [
      async (_request, _options, response) => {
        if (response.status === 403) {
          try {
            const body: any = await response.clone().json();
            if (body?.code === 'rest_cookie_invalid_nonce') {
              location.reload();
            }
          } catch {
            /* non-JSON 403 — ignore */
          }
        }
      },
    ],
  },
  timeout: 20000,
});

interface AbstractApi {
  get(input?: string, options?: Options): ResponsePromise;
  post(input?: string, options?: Options): ResponsePromise;
  put(input?: string, options?: Options): ResponsePromise;
  patch(input?: string, options?: Options): ResponsePromise;
  delete(input?: string, options?: Options): ResponsePromise;
}

class PrettyApi implements AbstractApi {
  constructor(private readonly base: string) {}
  get(input = '', options?: Options) {
    return _ky.get(`${this.base}/${input}`, options);
  }
  post(input = '', options?: Options) {
    return _ky.post(`${this.base}/${input}`, options);
  }
  put(input = '', options?: Options) {
    return _ky.put(`${this.base}/${input}`, options);
  }
  patch(input = '', options?: Options) {
    return _ky.patch(`${this.base}/${input}`, options);
  }
  delete(input = '', options?: Options) {
    return _ky.delete(`${this.base}/${input}`, options);
  }
}

class UglyApi implements AbstractApi {
  constructor(private readonly restRoute: string) {}

  private _sp(input?: string, options?: Options) {
    let sp = new URLSearchParams();
    if (options?.searchParams) {
      sp = new URLSearchParams(options.searchParams as Record<string, string>);
    }
    sp.set('rest_route', `${this.restRoute}/${input ?? ''}`);
    return sp;
  }

  get(input = '', options?: Options) {
    return _ky.get('', { ...options, searchParams: this._sp(input, options) });
  }
  post(input = '', options?: Options) {
    return _ky.post('', { ...options, searchParams: this._sp(input, options) });
  }
  put(input = '', options?: Options) {
    return _ky.put('', { ...options, searchParams: this._sp(input, options) });
  }
  patch(input = '', options?: Options) {
    return _ky.patch('', { ...options, searchParams: this._sp(input, options) });
  }
  delete(input = '', options?: Options) {
    return _ky.delete('', { ...options, searchParams: this._sp(input, options) });
  }
}

export function createApi(base: string): AbstractApi {
  const baseUrl = new URL(`${config.rest_url}${base}`);
  const restRoute = baseUrl.searchParams.get('rest_route');
  return restRoute ? new UglyApi(restRoute) : new PrettyApi(base);
}

export const api = createApi(config.rest_base);
export { HTTPError } from 'ky';
