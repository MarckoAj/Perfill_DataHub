import customersRepository from "../repositorios/customerRep.js";
import checkField from "./validations.js";
import logger from "../logger.js";

class CustomersModel {
  filterCustomerFields(customer) {
    const orderOfKeys = [
      'id', 'externalId', 'segmentId', 'description', 'cpfCnpj', 'email',
      'manager', 'note', 'address', 'adressComplement', 'latitude',
      'longitude', 'groupsId', 'managersId', 'contacts', 'uriAttachments',
      'active', 'dateLastUpdate', 'creationDate'
    ];

    return orderOfKeys.reduce((acc, key) => {
      if (key === "id") {
        acc["customerId"] = customer["id"];
      } else if ((key === "creationDate" || key === "dateLastUpdate") && customer[key] === "") {
        acc[key] = null;
      } else if (customer.hasOwnProperty(key)) {
        acc[key] = customer[key];
      }
      return acc;
    }, {});
  }

  async addCustomerEntity(customer) {
    const { email, groupsId, managersId, contacts, uriAttachments, ...filteredCustomer } = customer;
    try {
      if (await checkField.customerNotExistsInDB(customer.customerId)) {
        return await customersRepository.insertCustomer(filteredCustomer);
      }
    } catch (error) {
      throw new Error(`Error adding customer entity: ${error.message}`);
    }
  }

  async addCustomerContacts(customer) {
    for (const contactObj of customer.contacts) {
      contactObj.customerId = customer.customerId;
      try {
        if (await checkField.customerContactNotExistsInDB(contactObj)) {
          await customersRepository.insertCustomerContact(contactObj);
        }
      } catch (error) {
        throw new Error(`Error adding customer contact: ${error.message}`);
      }
    }
  }

  async addCustomerEmails(customer) {
    for (const email of customer.email) {
      const emailObj = { emailCustomer: email, customerId: customer.customerId };
      try {
        if (await checkField.customerEmailNotExistsInDB(emailObj)) {
          await customersRepository.insertCustomerEmail(emailObj);
        }
      } catch (error) {
        logger.error(`Error adding customer email: ${error.message}`);
      }
    }
  }

  async addCustomerGroups(customer) {
    for (const group of customer.groupsId) {
      const groupObj = { groupCustomer: group, customerId: customer.customerId };
      try {
        if (await checkField.customerGroupNotExistsInDB(groupObj)) {
          await customersRepository.insertCustomerGroups(groupObj);
        }
      } catch (error) {
        logger.error(`Error adding customer group: ${error.message}`);
      }
    }
  }

  async addCustomerURIs(customer) {
    for (const url of customer.uriAttachments) {
      const urlObj = { urlCustomer: url, customerId: customer.customerId };
      try {
        if (await checkField.customerURINotExistsInDB(urlObj)) {
          await customersRepository.insertCustomerURIAttachments(urlObj);
        }
      } catch (error) {
        logger.error(`Error adding customer URI: ${error.message}`);
      }
    }
  }

  async addCustomerManagers(customer) {
    for (const manager of customer.managersId) {
      const managerObj = { managerCustomer: manager, customerId: customer.customerId };
      try {
        if (await checkField.customerManagerNotExistsInDB(managerObj)) {
          await customersRepository.insertCustomerManager(managerObj);
        }
      } catch (error) {
        logger.error(`Error adding customer manager: ${error.message}`);
      }
    }
  }

  async addCustomer(customer) {
    const newCustomer = this.filterCustomerFields(customer);
    try {
      await this.addCustomerEntity(newCustomer);
      await this.addCustomerDetails(newCustomer);
    } catch (error) {
      logger.error(`Error adding customer: ${error.message}`);
      throw new Error(`Error adding customer: ${error.message}`);
    }
  }

  async addListOfCustomers(customersList) {
    logger.info(`Adding Customers from list (${customersList.length} Customers Found)`);
    const errors = [];
    for (const customer of customersList) {
      try {
        await this.addCustomer(customer);
      } catch (error) {
        errors.push(error.message);
      }
    }
    if (errors.length > 0) {
      throw new Error(`Errors adding customers from list: ${errors.join(', ')}`);
    }
  }

  async updateCustomer(customer) {
    const newCustomer = this.filterCustomerFields(customer);
    const { email, groupsId, managersId, contacts, uriAttachments, ...filteredCustomer } = newCustomer;
    if (!(await checkField.customerNotExistsInDB(newCustomer.customerId))) {
      try {
        await customersRepository.updateCustomer(filteredCustomer);
        await this.deleteCustomerDetails(newCustomer);
        await this.addCustomerDetails(newCustomer);
      } catch (error) {
        logger.error(`Error updating customer: ${error.message}`);
        throw new Error(`Error updating customer: ${error.message}`);
      }
    }
  }

  async addCustomerDetails(customer) {
    try {
      await Promise.all([
        this.addCustomerGroups(customer),
        this.addCustomerEmails(customer),
        this.addCustomerContacts(customer),
        this.addCustomerURIs(customer),
        this.addCustomerManagers(customer)
      ]);
    } catch (error) {
      logger.error(`Error adding customer details: ${error.message}`);
      throw new Error(`Error adding customer details: ${error.message}`);
    }
  }

  async deleteCustomerDetails(customer) {
    const { customerId } = customer;
    try {
      await Promise.all([
        customersRepository.deleteCustomerGroups(customerId),
        customersRepository.deleteCustomerEmails(customerId),
        customersRepository.deleteCustomerContacts(customerId),
        customersRepository.deleteCustomerURIAttachments(customerId),
        customersRepository.deleteCustomerManagers(customerId)
      ]);
    } catch (error) {
      logger.error(`Error deleting customer details: ${error.message}`);
      throw new Error(`Error deleting customer details: ${error.message}`);
    }
  }

  webHookOptions(option) {
    switch (option) {
      case "Inclusao":
        return this.addCustomer.bind(this);
      case "Alteracao":
      case "Exclusao":
        return this.updateCustomer.bind(this);
      default:
        break;
    }
  }
}

export default new CustomersModel();
