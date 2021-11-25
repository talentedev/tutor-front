import { NerdlyPage } from './app.po';

describe('learnt App', () => {
  let page: NerdlyPage;

  beforeEach(() => {
    page = new NerdlyPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
