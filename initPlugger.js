import Plugger from "@d11/plugger";
import PlugEvents from "@d11/plug-events";

const headers = { // put all headers which are required for api.dream11.com
  'Host': 'api.dream11.com',
  'locale': 'en-US',
};

const httpConfig = {
  headers,
  shouldRetry: true,
  apiBaseUrl: 'https://api.dream11.com'
};


const eventsConfig = {
  eventPath: "API_ENDPOINT_PATH", //
  enableBatching: true,
  enableEventsPersistence: true,
  persistEventsConfig: {
    persistenceInterval: 1000
  },
  shouldAddGlobalProps: true,
  globalPropsConfig: {
    commonProps: {
      app_name: "Web-App",
    }
  }
};

const plugEventsConfig = {
  name: Plugger.PLUGINS.EVENT,
  exec: PlugEvents,
  config: eventsConfig,
}

export const initPlugger = async () => {

  const pluggerConfig = {
    httpConfig: {
      apiBaseUrl: "API_SERVER_URL", // just put the base URL here
      headers: {
        'app-name': 'https://d11-events-framework.dream11.com',
      },
    },
    exception: {
      level: "WARN",
      silent: true,
    },
    plugins: [
      plugEventsConfig
    ],
    app: {
      state: window // for web apps, share window object
    }
  };
  return Plugger.init(pluggerConfig)
}

export const initializeEventsPlugin = async () => {
  const pluggerSdk = await initPlugger();
  const eventPlugin = await Plugger.getPlugin(Plugger.PLUGINS.EVENT);
  return eventPlugin;
}

export const sendEvent = async (eventName, data) => {
    const eventPlugin = await Plugger.getPlugin(Plugger.PLUGINS.EVENT);

    eventPlugin.fireEvent(eventName, data);

}