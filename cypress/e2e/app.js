/// <reference types="cypress" />
/* eslint-disable no-undef */

import { MockServer } from '../support/mock-socket'
import { WebSocket } from 'mock-socket'

let url = 'wss://chat.domain-web.ltd/xmpp-websocket'
const jidLocal = 'admin'
let jidDomain = 'domain-xmpp.ltd'

let mockServer

describe('XMPP Web for registered users', () => {
  before(() => {
    cy.clearAllCookies()
      .clearAllLocalStorage()
      .clearAllSessionStorage()
      .visit('/', {
        onBeforeLoad: (win) => {
        // stub websocket requests
          cy.stub(win, 'WebSocket').callsFake(url => new WebSocket(url))
        },
        onLoad: (win) => {
        // get config
          url = win.config.transports.websocket
          jidDomain = win.config.defaultDomain
          mockServer = MockServer({ url, jidLocal, jidDomain })
        },
      })
  })

  describe('Login', function () {
    it('displays login page with submit disabled', () => {
      cy.get('input[name="jid"]').should('have.attr', 'placeholder', `username@${jidDomain}`)
      cy.get('input[name="password"]').should('have.attr', 'placeholder', 'Password')
      cy.get('button[type="submit"]').should('be.disabled')
    })
    it('can login and route to main page', () => {
      cy.get('input[name="jid"]').type(jidLocal)
        .get('button[type="submit"]').should('be.disabled')
        .get('input[name="password"]').type('pwd')
        .get('button[type="submit"]').should('be.enabled')
        .get('button[type="submit"]').click()
        .hash().should('eq', '#/')
        .get('#navbar-menu', { includeShadowDom: true }).should('contain', `${jidLocal}@${jidDomain}`)
    })
    it('does not store credentials', () => {
      cy.visit('/', {
        onBeforeLoad: (win) => {
          cy.stub(win, 'WebSocket').callsFake(url => new WebSocket(url))
        },
      })
        .hash().should('eq', '#/login?redirect=/')
    })
    it('can login and store credentials', () => {
      cy.get('input[name="jid"]').clear().type('myuser')
        .get('input[name="password"]').type('pwd')
        .get('input[type="checkbox"]').check()
        .get('button[type="submit"]').click()
        .hash().should('eq', '#/')
        .get('#navbar-menu', { includeShadowDom: true }).should('contain', `${jidLocal}@${jidDomain}`)
      cy.visit('/', {
        onBeforeLoad: (win) => {
          cy.stub(win, 'WebSocket').callsFake(url => new WebSocket(url))
        },
      })
        .hash().should('eq', '#/')
    })
  })

  describe('Contacts', function () {
    it('displays contacts', () => {
      cy.get('#contactsList li').should('have.length', 1)
        .get('#contactsList li').first().should('have.text', `user2@${jidDomain}`)
    })
    it('can open conversation from contact and load history', () => {
      cy.get('#contactsList li').first().click()
        .get('#app').find('.sendbox').should('exist')
        .get('#messages-container').should('contain', 'Previous message')
    })
  })

  describe('Groups', function () {
    it('displays groups', () => {
      cy.get('#groupsList li').should('have.length', 1)
        .get('#groupsList li').first().should('have.text', 'Dev Team')
    })
    it('displays display contact in a group', () => {
      cy.get('#groupsList li:first-child a').click()
        .get('#groupsList li:first-child ul li').first().should('have.text', `user2@${jidDomain}`)
    })
    it('can open conversation from contact and load history', () => {
      cy.get('#contactsList li').first().click()
        .get('#app').find('.sendbox').should('exist')
        .get('#messages-container').should('contain', 'Previous message')
    })
  })

  describe('Chat', function () {
    it('can type message', () => {
      cy.get('.sendbox textarea').type('Hello, this is a new message')
    })
    it('can select an emoji', () => {
      cy.get('.sendbox button:not([type="submit"])[title="Choose an emoji"]').click()
        .get('.sendbox .emojiPicker [role="tab"]:first').next().click()
        .get('.sendbox .emojiPicker a[title="writing hand"]').click()
        .get('.sendbox button[type="submit"]').click()
    })
    it('display received message', () => {
      const msg = 'Hello, do you copy?'
      mockServer.emit('message', `<message type="chat" to="${jidLocal}@${jidDomain}" from="user2@${jidDomain}/dummyClient" id="C9Sojvuc_FSF-pTIN4QYz" xmlns="jabber:client"><body>${msg}</body><active xmlns="http://jabber.org/protocol/chatstates"/><origin-id xmlns="urn:xmpp:sid:0" id="C9Sojvuc_FSF-pTIN4QYz"/></message>`)
      cy.get('#messages-container').should('contain', msg)
    })
    it('display inline code formatted', () => {
      const code = 'inline code'
      const msg = 'This is inline code: `' + code + '`'
      mockServer.emit('message', `<message type="chat" to="${jidLocal}@${jidDomain}" from="user2@${jidDomain}/dummyClient" id="inline-code" xmlns="jabber:client"><body>${msg}</body><active xmlns="http://jabber.org/protocol/chatstates"/><origin-id xmlns="urn:xmpp:sid:0" id="inline-code"/></message>`)
      cy.get('#messages-container div:last-child code').should('have.text', code)
    })
    it('display code block formatted', () => {
      const code = 'code block'
      const msg = 'This is code block:\n``` js\n' + code + '\n```'
      mockServer.emit('message', `<message type="chat" to="${jidLocal}@${jidDomain}" from="user2@${jidDomain}/dummyClient" id="code-block" xmlns="jabber:client"><body>${msg}</body><active xmlns="http://jabber.org/protocol/chatstates"/><origin-id xmlns="urn:xmpp:sid:0" id="code-block"/></message>`)
      cy.get('#messages-container div:last-child pre code').should('have.text', code)
    })
  })

  describe('Rooms', function () {
    it('displays bookmarked rooms and a link to public rooms', () => {
      cy.get('#roomsList li').should('have.length', 5)
        .get('#roomsList li').first().should('have.text', 'welcome')
        .next().should('have.text', 'public')
        .next().should('have.text', 'Public rooms')
        .click()
        .hash().should('eq', '#/rooms/discover')
        .get('main table tbody tr').should('have.length', 2)
        .first().as('firstRoom').find('td').first().next().should('have.text', 'welcome')
        .next().should('have.text', '1')
        .next().next().next().next().next().should('have.descendants', 'i')
    })
    it('can join room', () => {
      cy.get('#roomsList li').first().click()
        .hash().should('eq', `#/rooms/welcome@conference.${jidDomain}`)
    })
    it('display received message on active room', () => {
      const msg = 'Hello room, do you copy?'
      mockServer.emit('message', `<message type="groupchat" to="${jidLocal}@${jidDomain}" from="welcome@conference.${jidDomain}/user2" id="C9Sojvuc" xmlns="jabber:client"><body>${msg}</body><active xmlns="http://jabber.org/protocol/chatstates"/><origin-id xmlns="urn:xmpp:sid:0" id="C9Sojvuc"/><stanza-id by='welcome@conference.${jidDomain}' id='PZBaESdTD4BUkPz2' xmlns='urn:xmpp:sid:0'/></message>`)
      cy.get('#messages-container').should('contain', msg)
    })
    it('display unread count on received message on inactive room', () => {
      const msg = 'Hello other room, read this later'
      mockServer.emit('message', `<message type="groupchat" to="${jidLocal}@${jidDomain}" from="public@anon-conference.${jidDomain}/user2" id="TIN4QYz" xmlns="jabber:client"><body>${msg}</body><active xmlns="http://jabber.org/protocol/chatstates"/><origin-id xmlns="urn:xmpp:sid:0" id="TIN4QYz"/><stanza-id by='welcome@conference.${jidDomain}' id='PZBaESdTD4BUkPz3' xmlns='urn:xmpp:sid:0'/></message>`)
      cy.get('#messages-container').should('not.contain', msg)
        .get('#roomsList li').first().next().find('a .tag').should('have.text', '1')
    })
    it('can create room', () => {
      cy.get('#roomsList li').first().next().next().next().next().click()
        .hash().should('eq', '#/rooms/new')
        .get('main input[title="Enter room Jid"]').as('roomName').should('exist')
        .get('main button[type="submit"]').should('be.disabled')
        .get('@roomName').type(`newRoom@conference.@${jidDomain}`)
        .get('main button[type="submit"]').should('be.enabled')
    })
  })

  describe('About', function () {
    it('display application information', () => {
      cy.get('#navbar-burger').click()
        .get('#navbar-menu a[href="#/about"]').click()
        .get('#navbar-burger').click()
        .hash().should('eq', '#/about')
        .get('main .tags .tag:nth-child(2)').should('contain', '0.10.0')
    })
  })

  describe('Logout', function () {
    it('logout from the server and return to login page', () => {
      cy.get('#navbar-burger').click()
        .get('#logout').click()
        .hash().should('eq', '#/login')
    })
  })
})
