frappe.provide('erpnext.selling');

erpnext.selling.SalesOrderDashboard = Class.extend({
	init: function(opts) {
		$.extend(this, opts);
		this.make();
	},
	make: function() {
		var me = this;
		this.start = 0;
		if(!this.sort_by) {
			this.sort_by = 'projected_qty';
			this.sort_order = 'asc';
		}

		this.content = $(frappe.render_template('sales_order_dashboard')).appendTo(this.parent);
		this.result = this.content.find('.result');

		this.content.on('click', '.add-delivery-btn', function() {
			handle_order_action($(this),"delivery")
        });
        this.content.on('click', '.add-payment-btn', function() {
			handle_order_action($(this),"payment")
		});
        
		function handle_order_action(element,type) {
            //todo
            if(type == "delivery"){
                let customer=unescape(element.attr('date-customer'));
                erpnext.selling.make_delivery_node_dialog(me.form.doc.name,customer, me.form.doc.items,function() {  me.refresh(); })
            } else if( type == "payment"){
                let customer=unescape(element.attr('date-customer'));
                erpnext.selling.make_payment_dialog(me.form.doc.name,customer, me.form.doc.grand_total - me.form.doc.advance_paid,function() {  me.refresh(); })
            }
 
        }
    

		// more
		this.content.find('.btn-more').on('click', function() {
			me.start += 20;
			me.refresh();
        });
        
        // function open_delivery_note(sales_order, warehouse, entry_type) {
		// 	frappe.model.with_doctype('Stock Entry', function() {
		// 		var doc = frappe.model.get_new_doc('Stock Entry');
		// 		if (entry_type) doc.stock_entry_type = entry_type;

		// 		var row = frappe.model.add_child(doc, 'items');
		// 		row.item_code = item;
		// 		row.s_warehouse = warehouse;

		// 		frappe.set_route('Form', doc.doctype, doc.name);
		// 	})
        // }
        
        // function open_payment_entry() {
		// 	frappe.model.with_doctype('Payment Entry', function() {
		// 		var doc = frappe.model.get_new_doc('Payment Entry');
		// 		doc.payment_type = "Receive";

		// 		var row = frappe.model.add_child(doc, '');
		// 		row.item_code = item;
		// 		row.s_warehouse = warehouse;

		// 		frappe.set_route('Form', doc.doctype, doc.name);
		// 	})
		// }

	},
	refresh: function() {
        
		if(this.before_refresh) {
			this.before_refresh();
		}
        this.render();;
	},
	render: function() {
		if(this.start===0) {
			this.result.empty();
		}
     
		var context = this.get_sales_order_dashboard_data();

		this.content.find('.more').addClass('hidden');
        // var message = __("Currently all things for the order are finished");
		// 	$(`<span class='text-muted small'>  ${message} </span>`).appendTo(this.result);
		 $(frappe.render_template('sales_order_dashboard_list', context)).appendTo(this.result);
	},
	get_sales_order_dashboard_data: function() {
      
        var delivered_per = this.form.doc.per_delivered;
        var delived_count=0;
        var tot_count=0;
        var tot_amount=this.form.doc.grand_total;
        var paid_amount=this.form.doc.advance_paid;
        var paid_per =  Math.ceil(paid_amount/tot_amount*100);
        var sales_items_list=this.form.doc.items;
        for(var i=0; i < sales_items_list.length ; i++){
            var sales_item_single = sales_items_list[i];
            delived_count += sales_item_single.delivered_qty;
            tot_count +=sales_item_single.qty;

        };
		return {

            data: [ {type: "Delivery Note",
                     label: "Delivery",
                     todo: true,
                     per: delivered_per,
                     finished: delived_count,
                     rest: tot_count-delived_count,
                     add_btn_class: "add-delivery-btn" ,
                     add_btn_label: "Add Delivery",
                     list_btn_class: "list-delivery-btn",
                     list_btn_label: "View Deliveries"
                    },
                    {type: "Payment Entry",
                     label: "Payment Received",
                     todo: true,
                     per: paid_per,
                     finished: paid_amount,
                     rest: tot_amount-paid_amount,
                     add_btn_class: "add-payment-btn" ,
                     add_btn_label: "Add Payment",
                     list_btn_class: "list-payment-btn",
                     list_btn_label: "View Payments"},
                    
            ],
            sales_order:this.form.doc.name,
            customer:this.form.doc.customer
		}
	}
})

erpnext.selling.make_delivery_node_dialog = function(sales_order,customer, items,callbackFn) {
    var fds = [
        {fieldname: 'sales_order', label: __('Sales Order'),
            fieldtype: 'Link', options: 'Sales Order', read_only: 1},
        {fieldname: 'customer', label: __('Customer'),
            fieldtype: 'Link', options: 'Customer', read_only: 1},
        {fieldname: 'naming_series', label: __('Series'),
            fieldtype: 'Select', options: 'MAT-DN-.YYYY.-\nMAT-DN-RET-.YYYY.-'},
        // {fieldname: 'items', label: __('Item'), fieldtype: 'Table',
        //     options: "Sales Order Item",reqd: 1},
        {fieldname: 'posting_date', label: __('Posting Date'), reqd: 1,
            fieldtype: 'Date' },
        {fieldname: 'posting_time', label: __('Posting Time'), reqd: 1,
            fieldtype: 'Time' },
        {fieldname: 'assignee' ,label: __('Assignee'),  fieldtype: 'Link', options:'User'}
    ];
    var i;
    for( i in items ){
        fds.push({
            fieldname: "item_no_"+items[i].item_code,
            label:items[i].item_name +" => delivered: ",
            fieldtype: "Data",
        });
        fds.push({
            fieldname: "item_so_detail_"+items[i].item_code,
            label:__('so detail'),
            fieldtype: "Data",
            hidden: 1,
            default: items[i].name
        });
    }
   
	var dialog = new frappe.ui.Dialog({
		title: __('Add Delivery'),
		fields: fds,
	})
    dialog.show();
    dialog.get_field('sales_order').set_input(sales_order);
	dialog.get_field('customer').set_input(customer);



	dialog.set_primary_action(__('Submit'), function() {
		var values = dialog.get_values();
		if(!values) {
			return;
		}


		frappe.call({
			method: 'erpnext.stock.doctype.delivery_note.delivery_note_utils.make_delivery_note',
			args: values,
			freeze: true,
			callback: function(r) {
				// frappe.show_alert(__('Delivery Note {0} created',
				// 	['<a href="#Form/Delivery Note/'+r.message.name+'">' + r.message.name+ '</a>']));
				dialog.hide();
				callbackFn(r);
			},
		});
	});

	$('<p style="margin-left: 10px;"><a class="link-open text-muted small">'
		+ __("Add more items or open full form") + '</a></p>')
		.appendTo(dialog.body)
		.find('.link-open')
		.on('click', function() {
			frappe.model.with_doctype('Delivery Note', function() {
				var doc = frappe.model.get_new_doc('Delivery Note');
				// doc.from_warehouse = dialog.get_value('source');
				// doc.to_warehouse = dialog.get_value('target');
				// var row = frappe.model.add_child(doc, 'items');
				// row.item_code = dialog.get_value('item_code');
				// row.f_warehouse = dialog.get_value('target');
				// row.t_warehouse = dialog.get_value('target');
				// row.qty = dialog.get_value('qty');
				// row.conversion_factor = 1;
				// row.transfer_qty = dialog.get_value('qty');
				// row.basic_rate = dialog.get_value('rate');
				// frappe.set_route('Form', doc.doctype, doc.name);
			})
		});
}

erpnext.selling.make_payment_dialog = function(sales_order,customer, default_paid_amount,callbackFn) {
    var fds = [
        {fieldname: 'sales_order', label: __('Sales Order'),
            fieldtype: 'Link', options: 'Sales Order', read_only: 1},
        {fieldname: 'party', label: __('Party'),
            fieldtype: 'Link', options: 'Customer', read_only: 1},
        {fieldname: 'payment_type', label: __('Payment Type'),
            fieldtype: 'Select', options: 'Receive\nPay\nInternal Transfer'},
        // {fieldname: 'items', label: __('Item'), fieldtype: 'Table',
        //     options: "Sales Order Item",reqd: 1},
        {fieldname: 'posting_date', label: __('Posting Date'), reqd: 1,
            fieldtype: 'Date' },
        {fieldname: 'paid_amount', label: __('Paid Amount'), reqd: 1,
            fieldtype: 'Data',    default: default_paid_amount },
        {fieldname: 'assignee' ,label: __('Assignee'),  fieldtype: 'Link', options:'User'}
    ];

   
	var dialog = new frappe.ui.Dialog({
		title: __('Add Payment'),
		fields: fds,
	})
    dialog.show();
    dialog.get_field('sales_order').set_input(sales_order);
	dialog.get_field('party').set_input(customer);



	dialog.set_primary_action(__('Submit'), function() {
		var values = dialog.get_values();
		if(!values) {
			return;
		}


		frappe.call({
			method: 'erpnext.stock.doctype.delivery_note.delivery_note_utils.make_delivery_note',
			args: values,
			freeze: true,
			callback: function(r) {
				// frappe.show_alert(__('Delivery Note {0} created',
				// 	['<a href="#Form/Delivery Note/'+r.message.name+'">' + r.message.name+ '</a>']));
				dialog.hide();
				callbackFn(r);
			},
		});
	});

	$('<p style="margin-left: 10px;"><a class="link-open text-muted small">'
		+ __("Add more items or open full form") + '</a></p>')
		.appendTo(dialog.body)
		.find('.link-open')
		.on('click', function() {
			frappe.model.with_doctype('Delivery Note', function() {
				var doc = frappe.model.get_new_doc('Delivery Note');
				// doc.from_warehouse = dialog.get_value('source');
				// doc.to_warehouse = dialog.get_value('target');
				// var row = frappe.model.add_child(doc, 'items');
				// row.item_code = dialog.get_value('item_code');
				// row.f_warehouse = dialog.get_value('target');
				// row.t_warehouse = dialog.get_value('target');
				// row.qty = dialog.get_value('qty');
				// row.conversion_factor = 1;
				// row.transfer_qty = dialog.get_value('qty');
				// row.basic_rate = dialog.get_value('rate');
				// frappe.set_route('Form', doc.doctype, doc.name);
			})
		});
}
