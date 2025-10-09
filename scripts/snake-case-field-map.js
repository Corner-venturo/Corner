/**
 * 完整欄位對應表（camelCase → snake_case）
 * 自動從專案中掃描生成
 * 用於 Step 4 全域替換
 */

const FIELD_MAP = {
  // ============================================
  // 基礎欄位（BaseEntity）
  // ============================================
  'createdAt': 'created_at',
  'updatedAt': 'updated_at',
  'createdBy': 'created_by',
  'updatedBy': 'updated_by',
  'deletedAt': 'deleted_at',
  'deletedBy': 'deleted_by',
  'isActive': 'is_active',

  // ============================================
  // 分頁欄位
  // ============================================
  'pageSize': 'page_size',
  'totalPages': 'total_pages',

  // ============================================
  // Tour 相關欄位
  // ============================================
  'tourName': 'tour_name',
  'startDate': 'start_date',
  'endDate': 'end_date',
  'maxPeople': 'max_people',
  'minPeople': 'min_people',
  'currentPeople': 'current_people',
  'maxCapacity': 'max_capacity',
  'minCapacity': 'min_capacity',
  'currentBookings': 'current_bookings',
  'convertedToTour': 'converted_to_tour',

  // ============================================
  // Order 相關欄位
  // ============================================
  'orderNumber': 'order_number',
  'orderId': 'order_id',
  'customerId': 'customer_id',
  'customerName': 'customer_name',
  'tourId': 'tour_id',
  'tourName': 'tour_name',
  'adultCount': 'adult_count',
  'childCount': 'child_count',
  'infantCount': 'infant_count',
  'numberOfPeople': 'number_of_people',
  'paidAmount': 'paid_amount',
  'totalAmount': 'total_amount',
  'lastOrderDate': 'last_order_date',

  // ============================================
  // Member 相關欄位
  // ============================================
  'englishName': 'english_name',
  'dateOfBirth': 'date_of_birth',
  'idNumber': 'id_number',
  'passportNumber': 'passport_number',
  'emergencyContact': 'emergency_contact',
  'emergencyPhone': 'emergency_phone',
  'dietaryRestrictions': 'dietary_restrictions',
  'medicalConditions': 'medical_conditions',
  'ageCategory': 'age_category',

  // ============================================
  // Customer 相關欄位
  // ============================================
  'contactPerson': 'contact_person',
  'contactPhone': 'contact_phone',
  'contactEmail': 'contact_email',
  'alternativePhone': 'alternative_phone',
  'isVip': 'is_vip',

  // ============================================
  // Employee 相關欄位
  // ============================================
  'employeeNumber': 'employee_number',
  'hireDate': 'hire_date',
  'leaderName': 'leader_name',
  'leaderId': 'leader_id',

  // ============================================
  // Payment 相關欄位
  // ============================================
  'paymentDate': 'payment_date',
  'paymentMethod': 'payment_method',
  'paymentStatus': 'payment_status',
  'requestDate': 'request_date',
  'requestNumber': 'request_number',
  'requesterId': 'requester_id',
  'approvedBy': 'approved_by',
  'approvedByName': 'approved_by_name',
  'createdByName': 'created_by_name',
  'receiptDate': 'receipt_date',

  // ============================================
  // Quote 相關欄位
  // ============================================
  'quoteNumber': 'quote_number',
  'quoteDate': 'quote_date',
  'validUntil': 'valid_until',
  'categoryId': 'category_id',

  // ============================================
  // Supplier 相關欄位
  // ============================================
  'supplierId': 'supplier_id',
  'supplierName': 'supplier_name',

  // ============================================
  // File/Template 相關欄位
  // ============================================
  'fileName': 'file_name',
  'filePath': 'file_path',
  'fileSize': 'file_size',
  'fileType': 'file_type',
  'fieldMappings': 'field_mappings',
  'excelStructure': 'excel_structure',
  'dataBinding': 'data_binding',
  'defaultValue': 'default_value',
  'dateFormat': 'date_format',
  'dateFrom': 'date_from',
  'dateTo': 'date_to',
  'isOptional': 'is_optional',

  // ============================================
  // Calendar 相關欄位
  // ============================================
  'eventType': 'event_type',
  'userId': 'user_id',

  // ============================================
  // 其他通用欄位
  // ============================================
  'totalCount': 'total_count',
  'itemCount': 'item_count',
  'firstName': 'first_name',
  'lastName': 'last_name',
  'phoneNumber': 'phone_number',
  'emailAddress': 'email_address',
  'streetAddress': 'street_address',
  'postalCode': 'postal_code',
  'companyName': 'company_name',
  'taxId': 'tax_id',
  'bankAccount': 'bank_account',
  'accountNumber': 'account_number',
};

module.exports = { FIELD_MAP };
