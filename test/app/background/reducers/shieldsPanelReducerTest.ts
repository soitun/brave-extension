/* global describe, it, before, after, afterEach */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import 'mocha'
import * as sinon from 'sinon'
import * as assert from 'assert'
import * as types from '../../../../app/constants/shieldsPanelTypes'
import * as windowTypes from '../../../../app/constants/windowTypes'
import * as tabTypes from '../../../../app/constants/tabTypes'
import * as webNavigationTypes from '../../../../app/constants/webNavigationTypes'
import shieldsPanelReducer from '../../../../app/background/reducers/shieldsPanelReducer'
import * as shieldsAPI from '../../../../app/background/api/shieldsAPI'
import * as tabsAPI from '../../../../app/background/api/tabsAPI'
import * as shieldsPanelState from '../../../../app/state/shieldsPanelState'
import { initialState } from '../../../testData'
import * as deepFreeze from 'deep-freeze-node'
import { ShieldDetails } from '../../../../app/types/actions/shieldsPanelActions';
import * as actions from '../../../../app/actions/shieldsPanelActions'
import { State } from '../../../../app/types/state/shieldsPannelState';

describe('braveShieldsPanelReducer', () => {
  it('should handle initial state', () => {
    assert.deepEqual(
      shieldsPanelReducer(undefined, actions.blockAdsTrackers('allow'))
    , initialState.shieldsPanel)
  })

  describe('ON_BEFORE_NAVIGATION', function () {
    before(function () {
      this.spy = sinon.spy(shieldsPanelState, 'resetBlockingStats')
      this.tabId = 1
    })
    after(function () {
      this.spy.restore()
    })
    afterEach(function () {
      this.spy.reset()
    })
    it('calls resetBlockingStats when isMainFrame is true', function () {
      shieldsPanelReducer(initialState.shieldsPanel, {
        type: webNavigationTypes.ON_BEFORE_NAVIGATION,
        tabId: this.tabId,
        url: 'https://www.brave.com',
        isMainFrame: true
      })
      assert.equal(this.spy.calledOnce, true)
      assert.equal(this.spy.getCall(0).args[1], this.tabId)
    })
    it('does not call resetBlockingStats when isMainFrame is false', function () {
      shieldsPanelReducer(initialState.shieldsPanel, {
        type: webNavigationTypes.ON_BEFORE_NAVIGATION,
        tabId: this.tabId,
        url: 'https://www.brave.com',
        isMainFrame: false
      })
      assert.equal(this.spy.notCalled, true)
    })
  })

  describe('WINDOW_REMOVED', function () {
    before(function () {
      this.spy = sinon.spy(shieldsPanelState, 'removeWindowInfo')
      this.windowId = 1
    })
    after(function () {
      this.spy.restore()
    })
    it('calls shieldsPanelState.removeWindowInfo', function () {
      shieldsPanelReducer(initialState.shieldsPanel, {
        type: windowTypes.WINDOW_REMOVED,
        windowId: this.windowId
      })
      assert.equal(this.spy.calledOnce, true)
      assert.equal(this.spy.getCall(0).args[1], this.windowId)
    })
  })

  describe('WINDOW_FOCUS_CHANGED', function () {
    before(function () {
      this.updateFocusedWindowSpy = sinon.spy(shieldsPanelState, 'updateFocusedWindow')
      this.requestShieldPanelDataSpy = sinon.spy(shieldsAPI, 'requestShieldPanelData')
      this.windowId = 1
      this.tabId = 2
      const state = deepFreeze({
        ...initialState.shieldsPanel,
        windows: {
          1: this.tabId
        },
        tabs: {}
      })
      shieldsPanelReducer(state, {
        type: windowTypes.WINDOW_FOCUS_CHANGED,
        windowId: this.windowId
      })
    })
    after(function () {
      this.updateFocusedWindowSpy.restore()
      this.requestShieldPanelDataSpy.restore()
    })
    it('calls shieldsPanelState.updateFocusedWindow', function () {
      assert.equal(this.updateFocusedWindowSpy.calledOnce, true)
      assert.equal(this.updateFocusedWindowSpy.getCall(0).args[1], this.windowId)
    })
    it('calls shieldsPanelState.requestShieldPanelDataSpy ', function () {
      assert.equal(this.requestShieldPanelDataSpy.withArgs(this.tabId).calledOnce, true)
    })
  })

  describe('TAB_DATA_CHANGED', function () {
    before(function () {
      this.updateActiveTabSpy = sinon.spy(shieldsPanelState, 'updateActiveTab')
      this.windowId = 1
      this.tabId = 2
      this.state = deepFreeze({...initialState.shieldsPanel, windows: {1: this.tabId}, tabs: {}})
    })
    after(function () {
      this.updateActiveTabSpy.restore()
    })
    afterEach(function () {
      this.updateActiveTabSpy.reset()
    })
    it('calls shieldsPanelState.updateActiveTab when the tab is active', function () {
      shieldsPanelReducer(this.state, {
        type: tabTypes.TAB_DATA_CHANGED,
        tabId: this.tabId,
        tab: {
          active: true,
          id: this.tabId,
          windowId: this.windowId,
          index: 1,
          pinned: false,
          highlighted: false,
          incognito: false,
          selected: false
        },
        changeInfo: {}
      })
      assert.equal(this.updateActiveTabSpy.calledOnce, true)
      assert.equal(this.updateActiveTabSpy.getCall(0).args[1], this.windowId)
      assert.equal(this.updateActiveTabSpy.getCall(0).args[2], this.tabId)
    })
    it('does not call shieldsPanelState.updateActiveTab when the tab is not active', function () {
      shieldsPanelReducer(this.state, {
        type: tabTypes.TAB_DATA_CHANGED,
        tabId: this.tabId,
        tab: {
          active: false,
          id: this.tabId,
          windowId: this.windowId,
          index: 1,
          pinned: false,
          highlighted: false,
          incognito: false,
          selected: false
        },
        changeInfo: {}
      })
      assert.equal(this.updateActiveTabSpy.notCalled, true)
    })
  })

  describe('TAB_CREATED', function () {
    before(function () {
      this.updateActiveTabSpy = sinon.spy(shieldsPanelState, 'updateActiveTab')
      this.windowId = 1
      this.tabId = 2
      this.state = {
        ...initialState.shieldsPanel,
        windows: {
          1: this.tabId
        },
        tabs: {}
      }
    })
    after(function () {
      this.updateActiveTabSpy.restore()
    })
    afterEach(function () {
      this.updateActiveTabSpy.reset()
    })
    it('calls shieldsPanelState.updateActiveTab when the tab is active', function () {
      shieldsPanelReducer(this.state, {
        type: tabTypes.TAB_CREATED,
        tab: {
          active: true,
          id: this.tabId,
          windowId: this.windowId,
          index: 1,
          pinned: false,
          highlighted: false,
          incognito: false,
          selected: false
        }
      })
      assert.equal(this.updateActiveTabSpy.calledOnce, true)
      assert.equal(this.updateActiveTabSpy.getCall(0).args[1], this.windowId)
      assert.equal(this.updateActiveTabSpy.getCall(0).args[2], this.tabId)
    })
    it('does not call shieldsPanelState.updateActiveTab when the tab is not active', function () {
      shieldsPanelReducer(this.state, {
        type: tabTypes.TAB_CREATED,
        tab: {
          active: false,
          id: this.tabId,
          windowId: this.windowId,
          index: 1,
          pinned: false,
          highlighted: false,
          incognito: false,
          selected: false
        }
      })
      assert.equal(this.updateActiveTabSpy.notCalled, true)
    })
  })

  describe('SHIELDS_PANEL_DATA_UPDATED', function () {
    it('updates state detail', function () {
      const tabId = 2
      const details: ShieldDetails = {
        id: tabId,
        hostname: 'brave.com',
        origin: 'brave.com',
        ads: 'block',
        trackers: 'block',
        httpUpgradableResources: 'block',
        javascript: 'block'
      }
      assert.deepEqual(
        shieldsPanelReducer(initialState.shieldsPanel, {
          type: types.SHIELDS_PANEL_DATA_UPDATED,
          details
        }), {
          currentWindowId: -1,
          tabs: {
            [tabId]: {
              adsBlocked: 0,
              trackersBlocked: 0,
              httpsRedirected: 0,
              javascriptBlocked: 0,
              hostname: 'brave.com',
              origin: 'brave.com',
              id: tabId,
              ads: 'block',
              trackers: 'block',
              httpUpgradableResources: 'block',
              javascript: 'block',
              controlsOpen: true,
              braveShields: 'allow'
            }
          },
          windows: {}
        })
    })
  })

  const origin = 'https://brave.com'
  const state: State = deepFreeze({
    tabs: {
      2: {
        origin,
        hostname: 'brave.com',
        adsBlocked: 0,
        controlsOpen: true,
        braveShields: 'allow',
        trackersBlocked: 0,
        httpsRedirected: 0,
        javascriptBlocked: 0,
        id: 2,
        httpUpgradableResources: 'block',
        javascript: 'block',
        trackers: 'block',
        ads: 'block'
      }
    },
    windows: {
      1: 2
    },
    currentWindowId: 1
  })

  describe('SHIELDS_TOGGLED', function () {
    before(function () {
      this.reloadTabSpy = sinon.spy(tabsAPI, 'reloadTab')
      this.setAllowBraveShieldsSpy = sinon.spy(shieldsAPI, 'setAllowBraveShields')
    })
    after(function () {
      this.reloadTabSpy.restore()
      this.setAllowBraveShieldsSpy.restore()
    })
    it('should call setAllowBraveShields', function () {
      assert.deepEqual(
        shieldsPanelReducer(state, {
          type: types.SHIELDS_TOGGLED,
          setting: 'allow'
        }), state)
      assert.equal(this.setAllowBraveShieldsSpy.withArgs(origin, 'allow').calledOnce, true)
    })
  })

  describe('HTTPS_EVERYWHERE_TOGGLED', function () {
    before(function () {
      this.reloadTabSpy = sinon.spy(tabsAPI, 'reloadTab')
      this.setAllowHTTPUpgradableResourcesSpy = sinon.spy(shieldsAPI, 'setAllowHTTPUpgradableResources')
    })
    after(function () {
      this.reloadTabSpy.restore()
      this.setAllowHTTPUpgradableResourcesSpy.restore()
    })
    it('should call setAllowHTTPUpgradableResources', function () {
      assert.deepEqual(
        shieldsPanelReducer(state, {
          type: types.HTTPS_EVERYWHERE_TOGGLED
        }), state)
      assert.equal(this.setAllowHTTPUpgradableResourcesSpy.withArgs(origin, 'allow').calledOnce, true)
    })
  })

  describe('JAVASCRIPT_TOGGLED', function () {
    before(function () {
      this.reloadTabSpy = sinon.spy(tabsAPI, 'reloadTab')
      this.setAllowJavaScriptSpy = sinon.spy(shieldsAPI, 'setAllowJavaScript')
    })
    after(function () {
      this.reloadTabSpy.restore()
      this.setAllowJavaScriptSpy.restore()
    })
    it('should call setAllowJavaScript', function () {
      assert.deepEqual(
        shieldsPanelReducer(state, {
          type: types.JAVASCRIPT_TOGGLED
        }), state)
      assert.equal(this.setAllowJavaScriptSpy.withArgs(origin, 'allow').calledOnce, true)
    })
  })

  describe('RESOURCE_BLOCKED', function () {
    it('increments for JS blocking', function () {
      let nextState = shieldsPanelReducer(state, {
        type: types.RESOURCE_BLOCKED,
        details: {
          blockType: 'javascript',
          tabId: 2
        }
      })
      assert.deepEqual(nextState, {
        currentWindowId: 1,
        tabs: {
          2: {
            origin: 'https://brave.com',
            hostname: 'brave.com',
            adsBlocked: 0,
            trackersBlocked: 0,
            httpsRedirected: 0,
            javascriptBlocked: 1,
            controlsOpen: true,
            braveShields: 'allow',
            httpUpgradableResources: 'block',
            id: 2,
            javascript: 'block',
            trackers: 'block',
            ads: 'block'
          }
        },
        windows: {
          1: 2
        }
      })
    })

    it('increases same count consecutively', function () {
      let nextState = shieldsPanelReducer(state, {
        type: types.RESOURCE_BLOCKED,
        details: {
          blockType: 'ads',
          tabId: 2
        }
      })
      assert.deepEqual(nextState, {
        currentWindowId: 1,
        tabs: {
          2: {
            origin: 'https://brave.com',
            hostname: 'brave.com',
            adsBlocked: 1,
            trackersBlocked: 0,
            httpsRedirected: 0,
            javascriptBlocked: 0,
            controlsOpen: true,
            braveShields: 'allow',
            httpUpgradableResources: 'block',
            id: 2,
            javascript: 'block',
            trackers: 'block',
            ads: 'block'
          }
        },
        windows: {
          1: 2
        }
      })

      nextState = shieldsPanelReducer(nextState, {
        type: types.RESOURCE_BLOCKED,
        details: {
          blockType: 'ads',
          tabId: 2
        }
      })
      assert.deepEqual(nextState, {
        currentWindowId: 1,
        tabs: {
          2: {
            origin: 'https://brave.com',
            hostname: 'brave.com',
            adsBlocked: 2,
            trackersBlocked: 0,
            httpsRedirected: 0,
            javascriptBlocked: 0,
            controlsOpen: true,
            braveShields: 'allow',
            httpUpgradableResources: 'block',
            id: 2,
            javascript: 'block',
            trackers: 'block',
            ads: 'block'
          }
        },
        windows: {
          1: 2
        }
      })
    })
    it('increases different tab counts separately', function () {
      let nextState = deepFreeze(shieldsPanelReducer(state, {
        type: types.RESOURCE_BLOCKED,
        details: {
          blockType: 'ads',
          tabId: 2
        }
      }))
      assert.deepEqual(nextState, {
        currentWindowId: 1,
        tabs: {
          2: {
            adsBlocked: 1,
            trackersBlocked: 0,
            httpsRedirected: 0,
            javascriptBlocked: 0,
            origin: 'https://brave.com',
            hostname: 'brave.com',
            controlsOpen: true,
            braveShields: 'allow',
            httpUpgradableResources: 'block',
            id: 2,
            javascript: 'block',
            trackers: 'block',
            ads: 'block'
          }
        },
        windows: {
          1: 2
        }
      })

      nextState = shieldsPanelReducer(nextState, {
        type: types.RESOURCE_BLOCKED,
        details: {
          blockType: 'ads',
          tabId: 3
        }
      })

      assert.deepEqual(nextState, {
        currentWindowId: 1,
        tabs: {
          2: {
            origin: 'https://brave.com',
            hostname: 'brave.com',
            adsBlocked: 1,
            trackersBlocked: 0,
            httpsRedirected: 0,
            javascriptBlocked: 0,
            controlsOpen: true,
            braveShields: 'allow',
            httpUpgradableResources: 'block',
            id: 2,
            javascript: 'block',
            trackers: 'block',
            ads: 'block'
          },
          3: {
            adsBlocked: 1,
            trackersBlocked: 0,
            httpsRedirected: 0,
            javascriptBlocked: 0
          }
        },
        windows: {
          1: 2
        }
      })
    })
    it('increases different resource types separately', function () {
      let nextState = deepFreeze(shieldsPanelReducer(state, {
        type: types.RESOURCE_BLOCKED,
        details: {
          blockType: 'ads',
          tabId: 2
        }
      }))
      assert.deepEqual(nextState, {
        currentWindowId: 1,
        tabs: {
          2: {
            origin: 'https://brave.com',
            hostname: 'brave.com',
            adsBlocked: 1,
            trackersBlocked: 0,
            httpsRedirected: 0,
            javascriptBlocked: 0,
            controlsOpen: true,
            braveShields: 'allow',
            httpUpgradableResources: 'block',
            id: 2,
            javascript: 'block',
            trackers: 'block',
            ads: 'block'
          }
        },
        windows: {
          1: 2
        }
      })

      nextState = shieldsPanelReducer(nextState, {
        type: types.RESOURCE_BLOCKED,
        details: {
          blockType: 'trackers',
          tabId: 2
        }
      })
      assert.deepEqual(nextState, {
        currentWindowId: 1,
        tabs: {
          2: {
            origin: 'https://brave.com',
            hostname: 'brave.com',
            adsBlocked: 1,
            trackersBlocked: 1,
            httpsRedirected: 0,
            javascriptBlocked: 0,
            controlsOpen: true,
            braveShields: 'allow',
            httpUpgradableResources: 'block',
            id: 2,
            javascript: 'block',
            trackers: 'block',
            ads: 'block'
          }
        },
        windows: {
          1: 2
        }
      })
      nextState = shieldsPanelReducer(nextState, {
        type: types.RESOURCE_BLOCKED,
        details: {
          blockType: 'httpUpgradableResources',
          tabId: 2
        }
      })
      assert.deepEqual(nextState, {
        currentWindowId: 1,
        tabs: {
          2: {
            origin: 'https://brave.com',
            hostname: 'brave.com',
            adsBlocked: 1,
            trackersBlocked: 1,
            httpsRedirected: 1,
            javascriptBlocked: 0,
            controlsOpen: true,
            braveShields: 'allow',
            httpUpgradableResources: 'block',
            id: 2,
            javascript: 'block',
            trackers: 'block',
            ads: 'block'
          }
        },
        windows: {
          1: 2
        }
      })
      nextState = shieldsPanelReducer(nextState, {
        type: types.RESOURCE_BLOCKED,
        details: {
          blockType: 'javascript',
          tabId: 2
        }
      })
      assert.deepEqual(nextState, {
        currentWindowId: 1,
        tabs: {
          2: {
            origin: 'https://brave.com',
            hostname: 'brave.com',
            adsBlocked: 1,
            trackersBlocked: 1,
            httpsRedirected: 1,
            javascriptBlocked: 1,
            controlsOpen: true,
            braveShields: 'allow',
            httpUpgradableResources: 'block',
            id: 2,
            javascript: 'block',
            trackers: 'block',
            ads: 'block'
          }
        },
        windows: {
          1: 2
        }
      })
    })
  })

  describe('BLOCK_ADS_TRACKERS', function () {
    before(function () {
      this.reloadTabSpy = sinon.spy(tabsAPI, 'reloadTab')
      this.setAllowAdsSpy = sinon.spy(shieldsAPI, 'setAllowAds')
      this.setAllowTrackersSpy = sinon.spy(shieldsAPI, 'setAllowTrackers')
    })
    after(function () {
      this.reloadTabSpy.restore()
      this.setAllowAdsSpy.restore()
      this.setAllowTrackersSpy.restore()
    })
    it('should call setAllowAds and setAllowTrackers', function () {
      assert.deepEqual(
        shieldsPanelReducer(state, {
          type: types.BLOCK_ADS_TRACKERS,
          setting: 'allow'
        }), state)
      assert.equal(this.setAllowAdsSpy.withArgs(origin, 'block').calledOnce, true)
      assert.equal(this.setAllowTrackersSpy.withArgs(origin, 'block').calledOnce, true)
    })
  })

  describe('CONTROLS_TOGGLED', function () {
    before(function () {
      this.spy = sinon.spy(shieldsPanelState, 'updateTabShieldsData')
    })
    after(function () {
      this.spy.restore()
    })
    it('should call updateTabShieldsData', function () {
      assert.deepEqual(
        shieldsPanelReducer(state, {
          type: types.CONTROLS_TOGGLED,
          setting: true
        }), state)

      assert.equal(this.spy.calledOnce, true)
      assert.equal(this.spy.getCall(0).args[2].controlsOpen, true)
    })
  })
})