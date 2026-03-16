import executeQuery from "../infrastructure/database/queries.js";

class customersRepository {
  selectCustomerById(userId) {
    const sql = `
    SELECT * FROM customers_auvo WHERE customerId = ?`;
    return executeQuery(sql, userId);
  }

  selectEmailCustomer(customerEmailObj) {
    const sql = `
    SELECT * FROM customers_emails WHERE customer_email = ? AND customerId = ?`;
    const values = Object.values(customerEmailObj);
    return executeQuery(sql, values);
  }

  selectContactCustomer(customerContactObj) {
    const sql = `
    SELECT * FROM customers_contacts WHERE contactId = ? AND customerId = ?`;
    const values = [customerContactObj.id, customerContactObj.customerId];
    return executeQuery(sql, values);
  }

  selectGroupCustomer(customerGroupObj) {
    const sql = `
    SELECT * FROM customers_groups WHERE groupId = ? AND customerId = ?`;
    const values = Object.values(customerGroupObj);
    return executeQuery(sql, values);
  }

  selectURICustomer(customerURIObj) {
    const sql = `
    SELECT * FROM customers_uriAttachments WHERE urls = ? AND customerId = ?`;
    const values = Object.values(customerURIObj);
    return executeQuery(sql, values);
  }

  selectManagerCustomer(manangerManangerObj) {
    const sql = `
    SELECT * FROM customers_managers WHERE userId = ? AND customerId = ?`;
    const values = Object.values(manangerManangerObj);
    return executeQuery(sql, values);
  }

  insertCustomer(customer) {
    const sql = `
    INSERT INTO customers_auvo (customerId, externalId, segmentId, description, cpfCnpj, manager, note, address, addressComplement, latitude, longitude, active, dateLastUpdate, creationDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = Object.values(customer);
    return executeQuery(sql, values);
  }

  insertCustomerEmail(customerEmail) {
    const sql = `
    INSERT INTO customers_emails (customer_email, customerID) VALUES (?, ?)`;
    const values = Object.values(customerEmail);
    return executeQuery(sql, values);
  }

  insertCustomerContact(customerContact) {
    const sql = `
    INSERT INTO customers_contacts (contactId, contactName, contactJobPosition, contactEmail, contactPhone, customerId) VALUES (?, ?, ?, ?, ?, ?)`;
    const values = Object.values(customerContact);
    return executeQuery(sql, values);
  }

  insertCustomerURIAttachments(customerURI) {
    const sql = `
    INSERT INTO customers_uriAttachments (urls, customerId) VALUES (?, ?)`;
    const values = Object.values(customerURI);
    return executeQuery(sql, values);
  }

  insertCustomerManager(customerManager) {
    const sql = `
    INSERT INTO customers_managers (userId, customerId) VALUES (?, ?)`;
    const values = Object.values(customerManager);
    return executeQuery(sql, values);
  }

  insertCustomerGroups(customerGroup) {
    const sql = `
    INSERT INTO customers_groups (groupId, customerId) VALUES (?, ?)`;
    const values = Object.values(customerGroup);
    return executeQuery(sql, values);
  }

  updateCustomer(customer) {
    const sql = `
    UPDATE customers_auvo SET externalId = ?, segmentId = ?, description = ?, cpfCnpj = ?, manager = ?, note = ?, address = ?, addressComplement = ?, latitude = ?, longitude = ?, active = ?, dateLastUpdate = ?, creationDate = ? WHERE customerId = ?`;
    const values = Object.values(customer);
    values.push(values.shift());
    return executeQuery(sql, values);
  }

  deleteCustomerEmails(customerId) {
    const sql = `
    DELETE FROM customers_emails WHERE customerId = ?`;
    return executeQuery(sql, customerId);
  }

  deleteCustomerContacts(customerId) {
    const sql = `
    DELETE FROM customers_contacts WHERE customerId = ?`;
    return executeQuery(sql, customerId);
  }

  deleteCustomerURIAttachments(customerId) {
    const sql = `
    DELETE FROM customers_uriAttachments WHERE customerId = ?`;
    return executeQuery(sql, customerId);
  }

  deleteCustomerManagers(customerId) {
    const sql = `
    DELETE FROM customers_managers WHERE customerId = ?`;
    return executeQuery(sql, customerId);
  }

  deleteCustomerGroups(customerId) {
    const sql = `
    DELETE FROM customers_groups WHERE customerId = ?`;
    return executeQuery(sql, customerId);
  }
}

export default new customersRepository();
