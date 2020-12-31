from __future__ import unicode_literals
import frappe, erpnext
from frappe.utils import cint, flt

from six import string_types

@frappe.whitelist()
def make_delivery_note(**args):
    s = frappe.new_doc("Delivery Note")

    args = frappe._dict(args)
    
    if args.posting_date or args.posting_time:
        s.set_posting_time = 1

    if args.posting_date:
        s.posting_date = args.posting_date
    if args.posting_time:
        s.posting_time = args.posting_time
    
    if args.customer:
        s.customer = args.customer
    isValid = False;
    item_dict = {}
    for i in args:
        if(i.startswith( 'item_no_' )):
            isValid = True
            item_code =  i[8:]
            qty = args[i]
            if item_dict.get(item_code) is  None:
                item_dict[item_code] = {
                    "item_code":item_code,
                    "qty":qty,
                    "against_sales_order":args.sales_order
                }
            else:
                item_dict[item_code].qty = qty
            

        if(i.startswith( 'item_so_detail_' )):
            item_code =  i[15:]
            so_detail =  args[i]

            if item_dict.get(item_code) is  None:
                item_dict[item_code] = {
                    "item_code":item_code,
                    "so_detail":so_detail,
                    "against_sales_order":args.sales_order
                }
            else:
                item_dict[item_code]["so_detail"] = so_detail

    for i in item_dict:
        s.append("items", item_dict[i])

    if isValid:
        s.insert()
        s.submit()
        
    