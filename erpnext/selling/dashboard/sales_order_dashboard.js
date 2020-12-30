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
			handle_order_action($(this))
        });
        this.content.on('click', '.add-payment-btn', function() {
			handle_order_action($(this))
		});

		function handle_order_action(element) {
            //todo
            
            let customer=unescape(element.attr('date-customer'));
            console.log(customer);
            erpnext.selling.make_delivery_node_dialog(customer, function() { me.refresh(); })
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
		return {
            data: [ {type: "Delivery Note",
                     label: "Delivery",
                     todo: true,
                     per: 0,
                     finished: 0,
                     rest: 100,
                     add_btn_class: "add-delivery-btn" ,
                     add_btn_label: "Add Delivery",
                     list_btn_class: "list-delivery-btn",
                     list_btn_label: "View Deliveries"},
                    {type: "Payment Entry",
                     label: "Payment Received",
                     todo: true,
                     per: 80,
                     finished: 80,
                     rest: 20,
                     add_btn_class: "add-payment-btn" ,
                     add_btn_label: "Add Payment",
                     list_btn_class: "list-payment-btn",
                     list_btn_label: "View Payments"},
                    
            ],
            sales_order:"xxxx",
            customer:"China Everbright Bank"
		}
	}
})

erpnext.selling.make_delivery_node_dialog = function(customer, callback) {
	var dialog = new frappe.ui.Dialog({
		title: __('Add Delivery'),
		fields: [
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
            {filename: 'assignee' ,label: __('Assignee'),  fieldtype: 'Link', options:'User'}
		],
	})
	dialog.show();
	dialog.get_field('customer').set_input(customer);



	dialog.set_primary_action(__('Submit'), function() {
		var values = dialog.get_values();
		if(!values) {
			return;
		}


		frappe.call({
			method: 'erpnext.selling.doctype.sales_order.sales_order.make_delivery_note',
			args: values,
			freeze: true,
			callback: function(r) {
				frappe.show_alert(__('Delivery Note {0} created',
					['<a href="#Form/Delivery Note/'+r.message.name+'">' + r.message.name+ '</a>']));
				dialog.hide();
				callback(r);
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
