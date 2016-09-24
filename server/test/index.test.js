'use strict';

import mongoose from 'mongoose';
import chai from 'chai';
import request from 'supertest';
import btoa from 'btoa';
import faker from 'Faker';
import titlegen from 'titlegen';
import config from '../config';
import Contact from '../model/contacts.model.js';
const admin = require('../config/config').admin;
const expect = chai.expect;

mongoose.Promise = global.Promise;
mongoose.connect(config.getDbConnection());

describe('Routing', function () {
  let url = 'http://localhost:3000';
  let api = 'http://localhost:3000/api/contacts';
  let base64Str = btoa(`${admin.user}:${admin.password}`);
  let config = {
    authorization: {
      "Authorization": `Basic ${base64Str}`,
      "Accept": "application/json",
    },
    unauthorization: {
      "WWW-Authenticate": "Basic realm=Authorization Required",
    },
  };

  var generator = titlegen.create();
  generator.feed([
    'My Love',
    'Soulmate',
    'My Boss',
    'My Partner',
    'My Teacher',
    'My Mentor',
    'My Big Brother',
    'My Mom',
    'My Dad',
  ]);

  var gentype = titlegen.create();
  gentype.feed([
    'Mobile',
    'Work',
    'Home',
  ]);

  var etype = titlegen.create();
  etype.feed([
    'Personal',
    'Work',
    'Other',
  ]);

  var adrtype = titlegen.create();
  adrtype.feed([
    'Home',
    'Work',
    'Other',
  ]);

  var contactTitle = generator.next();
  var option = gentype.next();
  var option2 = etype.next();
  var option3 = adrtype.next();
  var contact = {
    name: faker.Name.findName(),
    title: contactTitle,
    email: [
      { option: option2, email: faker.Internet.email() },
      { option: option2, email: faker.Internet.email() },
    ],
    phone: [
      { option, number: faker.PhoneNumber.phoneNumber() },
      { option, number: faker.PhoneNumber.phoneNumber() },
    ],
    address: [
      { option: option3, address: faker.Address.streetAddress() },
      { option: option3, address: faker.Address.streetAddress() },
    ],
    company: faker.Company.companyName(),
    favorite: false,
  };

  describe("GET '/'", function () {
    it('should get status code 200 with no auth', function (done) {
      request(url)
        .get('/')
        .set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8')
        .expect(200, done);
    });
  });

  describe("GET '/api' that not actually route", function () {
    it('should get status 404', function (done) {
      request(url)
        .get('/api')
        .expect('Content-Type', 'text/html; charset=utf-8')
        .expect(404, done);
    });

    describe("GET '/api/contacts'", function () {
      it('should get status 200 if Authorized and return Array-JSON', function (done) {
        request(api)
          .get('/')
          .set(config.authorization)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            expect(res.body).to.be.instanceof(Array);
            done();
          });
      });
    });

    describe("GET '/api/contacts/:id'", function () {
      it('should get status 200 if Authorized and return Object-json', function (done) {
        let newContact = new Contact(contact);
        var promise = newContact.save();
        promise.then(contact => {
          if (contact) {
            request(api)
              .get('/' + contact.id)
              .set(config.authorization)
              .expect('Content-Type', /json/)
              .expect(200)
              .end((err, res) => {
                if (err) return done(err);
                expect(res.body).to.be.an('object');
                expect(res.body).to.have.property('name');
                expect(res.body).to.have.property('title');
                expect(res.body).to.have.property('email');
                expect(res.body).to.have.property('phone');
                expect(res.body).to.have.property('address');
                expect(res.body).to.have.property('company');
                expect(res.body).to.have.property('_id').to.equal(contact.id);
                done();
              });
          }
        })
        .catch(err => {
          done(err);
        });
      });
    });

  });

  describe("POST '/api/contacts'", function () {
    it('should post and get response status 200', function (done) {
      let emailVal = [
        { option: option2, email: faker.Internet.email() },
        { option: option2, email: faker.Internet.email() },
      ];

      let phoneVal = [
        { option, number: faker.PhoneNumber.phoneNumber() },
        { option, number: faker.PhoneNumber.phoneNumber() },
      ];

      let addVal = [
        { option: option3, address: faker.Address.streetAddress() },
        { option: option3, address: faker.Address.streetAddress() },
      ];

      let contact = {
        name: `"${faker.Name.findName()} post"`,
        title: `"${contactTitle}"`,
        email: JSON.stringify(emailVal),
        phone: JSON.stringify(phoneVal),
        address: JSON.stringify(phoneVal),
        company: `"${faker.Company.companyName()}"`,
      };

      request(api)
        .post('/')
        .set(config.authorization)
        .send(contact)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.be.an('object');
          done();
        });
    });

    describe('upload image', function () {
      it('should get status 200 response', function (done) {
        let emailVal = [
          { option: option2, email: faker.Internet.email() },
          { option: option2, email: faker.Internet.email() },
        ];

        let phoneVal = [
          { option, number: faker.PhoneNumber.phoneNumber() },
          { option, number: faker.PhoneNumber.phoneNumber() },
        ];

        let addVal = [
          { option: option3, address: faker.Address.streetAddress() },
          { option: option3, address: faker.Address.streetAddress() },
        ];

        request(api)
          .post('/')
          .set(config.authorization)
          .field('Content-Type', 'multipart/form-data')
          .field('name', JSON.stringify("Tes upload"))
          .field('phone', JSON.stringify(phoneVal))
          .field('email', JSON.stringify(emailVal))
          .field('address', JSON.stringify(addVal))
          .attach('avatar', '/Users/adi/Desktop/Tesphoto.png')
          .end((err, res) => {
            if (err) return done(err);
            expect(res.status).to.equal(200);
            done();
          });
      });
    });
  });

  describe("PUT '/api/contacts/:id'", function () {
    it('should get status 200 if Authorized', function (done) {
      let emailVal = [
        { option: option2, email: faker.Internet.email() },
        { option: option2, email: faker.Internet.email() },
      ];

      let phoneVal = [
        { option, number: faker.PhoneNumber.phoneNumber() },
        { option, number: faker.PhoneNumber.phoneNumber() },
      ];

      let addVal = [
        { option: option3, address: faker.Address.streetAddress() },
        { option: option3, address: faker.Address.streetAddress() },
      ];

      let contact = {
        name: `"${faker.Name.findName()} post"`,
        title: `"${contactTitle}"`,
        email: JSON.stringify(emailVal),
        phone: JSON.stringify(phoneVal),
        address: JSON.stringify(phoneVal),
        company: `"${faker.Company.companyName()}"`,
      };

      let newContact = new Contact(contact);
      var promise = newContact.save();
      promise.then(contact => {
        if (contact) {
          contact.name = JSON.stringify("Jhonny Depp put");
          contact.company = JSON.stringify("Hollywood");
          contact.title = JSON.stringify("Actress");
          request(api)
            .put('/' + contact.id)
            .set(config.authorization)
            .send(contact)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
              if (err) return done(err);
              expect(res.body).to.be.an('object');
              expect(res.body).to.have.property('name').to.equal('Jhonny Depp put');
              expect(res.body).to.have.property('title');
              expect(res.body).to.have.property('email');
              expect(res.body).to.have.property('phone');
              expect(res.body).to.have.property('address');
              expect(res.body).to.have.property('company');
              expect(res.body).to.have.property('_id').to.equal(contact.id);
              done();
            });
        }
      })
      .catch(err => {
        done(err);
      });
    });
  });

  describe("PATCH '/api/contacts/:id'", function () {
    it('should get status 200 if Authorized', function (done) {
      let newContact = new Contact(contact);
      var promise = newContact.save();
      promise.then(contact => {
        if (contact) {
          contact.favorite = true;
          contact.name = 'patch';
          request(api)
            .patch('/' + contact.id)
            .set(config.authorization)
            .send(contact)
            .expect(200)
            .end((err, res) => {
              if (err) return done(err);
              expect(res.body).to.be.an('object');
              expect(res.body).to.have.property('name').to.equal('patch');
              expect(res.body).to.have.property('favorite').to.equal(true);
              done();
            });
        }
      })
      .catch(err => {
        done(err);
      });
    });
  });

  describe("DELETE '/api/contacts/:id'", function () {
    let emailVal = [
      { option: option2, email: faker.Internet.email() },
      { option: option2, email: faker.Internet.email() },
    ];

    let phoneVal = [
      { option, number: faker.PhoneNumber.phoneNumber() },
      { option, number: faker.PhoneNumber.phoneNumber() },
    ];

    let addVal = [
      { option: option3, address: faker.Address.streetAddress() },
      { option: option3, address: faker.Address.streetAddress() },
    ];

    let contact = {
      name: `"${faker.Name.findName()} post"`,
      title: `"${contactTitle}"`,
      email: JSON.stringify(emailVal),
      phone: JSON.stringify(phoneVal),
      address: JSON.stringify(phoneVal),
      company: `"${faker.Company.companyName()}"`,
    };

    it('should get status 200 if Authorized', function (done) {
      let newContact = new Contact(contact);
      var promise = newContact.save();
      promise.then(contact => {
        if (contact) {
          request(api)
            .delete('/' + contact.id)
            .set(config.authorization)
            .expect(200, done);
        }
      })
      .catch(err => {
        done(err);
      });
    });
  });
});
