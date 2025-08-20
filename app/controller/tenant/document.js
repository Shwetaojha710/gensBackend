const Document = require('../../models/documents');
const Helper = require('../../helper/helper');
const empPersonal = require('../../models/empPersonal');
const path = require('path');
const fs = require('fs');
const documentType = require('../../models/documentType');

exports.addDocument = async (req, res) => {
  const { type, employeeId,status } = req.body;
  const tenantId = req.users?.tenantId;

  try {
    if (!tenantId || !employeeId) {
      Helper.deleteUploadedFiles(req.files);
      return Helper.response(false, "Tenant ID and Employee ID are required", null, res, 400);
    }

    const typeD = await documentType.findOne({ where: { id:type, tenantId } });

  

    const employeeExists = await empPersonal.findOne({ where: { id: employeeId, tenantId } });
    if (!employeeExists) {
      Helper.deleteUploadedFiles(req.files);
      return Helper.response(false, "Employee not found", null, res, 404);
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      return Helper.response(false, "No files uploaded", null, res, 400);
    }

    const createdDocs = [];

   for (const file of req.files) {
  const newDoc = await Document.create({
    tenantId,
    employeeId,
    type,
    doc_type: file.mimetype,
    doc_name: file.filename,
    createdBy: req.users?.id,
    updatedBy: req.users?.id,
    status:status || 'active', 
  });
  createdDocs.push(newDoc);
}

    return Helper.response(true, "Documents added successfully", createdDocs, res, 200);
  } catch (error) {
    console.error("Error adding document:", error);
    Helper.deleteUploadedFiles(req.files);
    return Helper.response(false, "Internal server error", null, res, 500);
  }
};

exports.getDocument = async (req, res) => {
  const { employeeId } = req.body;
  const tenantId = req.users?.tenantId;

  try {
    if (!tenantId || !employeeId) {
      return Helper.response(false, "Tenant ID and Employee ID are required", null, res, 400);
    }

    const documents = await Document.findAll({ where: { tenantId, employeeId } });

    if (!documents || documents.length === 0) {
      return Helper.response(false, "No documents found", null, res, 404);
    }

    return Helper.response(true, "Documents retrieved successfully", documents, res, 200);
  } catch (error) {
    console.error("Error retrieving documents:", error);
    return Helper.response(false, "Internal server error", null, res, 500);
  }
};

exports.updateDocument = async (req, res) => {
  const { employeeId, status } = req.body;
  const tenantId = req.users?.tenantId;

  try {
    if (!tenantId || !employeeId) {
      Helper.deleteUploadedFiles(req.files);
      return Helper.response(false, "Tenant ID and Employee ID are required", null, res, 400);
    }

    const employeeExists = await empPersonal.findOne({ where: { id: employeeId, tenantId } });
    if (!employeeExists) {
      Helper.deleteUploadedFiles(req.files);
      return Helper.response(false, "Employee not found", null, res, 404);
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      return Helper.response(false, "No files uploaded", null, res, 400);
    }

    const updatedDocuments = [];

    for (const file of req.files) {
      const existingDoc = await Document.findOne({
        where: { tenantId, employeeId, type: file.fieldname },
      });

      if (existingDoc) {
        const oldFilePath = path.join(__dirname, '../../../upload', existingDoc.doc_name);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }

        existingDoc.doc_name = file.filename;
        existingDoc.doc_type = file.mimetype;
        existingDoc.updatedBy = req.users?.id;
        await existingDoc.save();
        updatedDocuments.push(existingDoc);
      } else {
        const newDoc = await Document.create({
          tenantId,
          employeeId,
          type: file.fieldname,
          doc_type: file.mimetype,
          doc_name: file.filename,
          createdBy: req.users?.id,
          updatedBy: req.users?.id,
          status:status || 'active',
        });
        updatedDocuments.push(newDoc);
      }
    }

    return Helper.response(true, "Documents updated successfully", updatedDocuments, res, 200);
  } catch (error) {
    console.error("Error updating documents:", error);
    Helper.deleteUploadedFiles(req.files);
    return Helper.response(false, "Internal server error", null, res, 500);
  }
};

exports.deleteDocument = async (req, res) => {
  const { documentId, employeeId } = req.body;
  const tenantId = req.users?.tenantId;

  try {
    if (!tenantId || !employeeId || !documentId) {
      return Helper.response(false, "Tenant ID, Employee ID, and Document ID are required", null, res, 400);
    }

    const document = await Document.findOne({ where: { id: documentId, tenantId, employeeId } });

    if (!document) {
      return Helper.response(false, "Document not found", null, res, 404);
    }

    const filePath = path.join(__dirname, '../../../upload', document.doc_name);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error(`Error deleting file ${document.doc_name}:`, err);
      }
    }

    await document.destroy();

    return Helper.response(true, "Document deleted successfully", null, res, 200);
  } catch (error) {
    console.error("Error deleting document:", error);
    return Helper.response(false, "Internal server error", null, res, 500);
  }
};

