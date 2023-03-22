import * as path from 'path';
import { test, expect } from '../../playwright/localTest';
import { ToolpadRuntime } from '../../models/ToolpadRuntime';
import { fileReplaceAll } from '../../utils/fs';
import { ToolpadEditor } from '../../models/ToolpadEditor';
import { APP_ID_LOCAL_MARKER } from '../../../packages/toolpad-app/src/constants';

// We can run our own httpbin instance if necessary:
//    $ docker run -p 80:80 kennethreitz/httpbin
const customHttbinBaseUrl = process.env.HTTPBIN_BASEURL;

if (customHttbinBaseUrl) {
  // eslint-disable-next-line no-console
  console.log(`Running tests with custom httpbin service: ${customHttbinBaseUrl}`);
}

const HTTPBIN_SOURCE_URL = 'https://httpbin.org/';
const HTTPBIN_TARGET_URL = customHttbinBaseUrl || HTTPBIN_SOURCE_URL;

test.use({
  localAppConfig: {
    template: path.resolve(__dirname, './fixture'),
    cmd: 'dev',
  },
});

test('rest basics', async ({ page, localApp }) => {
  const queriesFilePath = path.resolve(localApp.dir, './toolpad.yml');
  await fileReplaceAll(queriesFilePath, HTTPBIN_SOURCE_URL, HTTPBIN_TARGET_URL);

  const runtimeModel = new ToolpadRuntime(page);
  await runtimeModel.gotoPage(APP_ID_LOCAL_MARKER, 'page1');
  await expect(page.locator('text="query1: query1_value"')).toBeVisible();
  await expect(page.locator('text="query2: undefined"')).toBeVisible();
  await page.locator('button:has-text("fetch query2")').click();
  await expect(page.locator('text="query2: query2_value"')).toBeVisible();

  const editorModel = new ToolpadEditor(page);
  await editorModel.goto(APP_ID_LOCAL_MARKER);

  await editorModel.componentEditor.getByRole('button', { name: 'query1' }).click();
  const queryEditor = page.getByRole('dialog', { name: 'query1' });
  await queryEditor.getByRole('button', { name: 'Preview' }).click();
  const networkTab = queryEditor.getByRole('tabpanel', { name: 'Network' });
  await expect(networkTab.getByText('/get?query1_param1=query1_value')).not.toBeEmpty();
});
