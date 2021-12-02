define(function(require){
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster'),
		timezone = require('monster-timezone');

	var resellerInvoices = {

		subscribe: {
			'myaccount.resellerInvoices.renderContent': '_resellerInvoicesRenderContent'
		},

		_resellerInvoicesRenderContent: function(args){
			var self = this;

			self.resellerInvoicesGetData(function(data) {
				var resellerInvoicesTemplate = $(self.getTemplate({
					name: 'layout',
					data: data,
					submodule: 'resellerInvoices'
				}));

				self.resellerInvoicesBindEvents(resellerInvoicesTemplate, data);

				monster.pub('myaccount.renderSubmodule', resellerInvoicesTemplate);

				args.callback && args.callback(resellerInvoicesTemplate);
			});
		},

		resellerInvoicesBindEvents: function(template, data) {
			var self = this;

			template.find('.download').on('click', function() {
				var $this = $(this),
				invoiceId = $this.data('invoice'),
				invoiceDate = $this.data('date');

					var data = {
						"invoiceId": invoiceId,
						"invoiceDate": invoiceDate
					}

					self.resellerGetInvoice(data);
			});	

		},

		resellerGetInvoice: function(data) {
			var self = this;
			
			var url = `https://us-central1-core-voice.cloudfunctions.net/billing-audit-dev/invoice?invoiceId=${data.invoiceId}&invoiceDate=${data.invoiceDate}`;

			window.open(url, "Download");
		},

		resellerInvoicesGetData: function(globalCallback) {
			var self = this;

			monster.parallel({
				account: function(callback) {
					self.callApi({
						resource: 'account.get',
						data: {
							accountId: self.accountId
						},
						success: function(data, status) {
							callback && callback(null, data.data);
						}
					});
				},
				payments: function(callback) {
					monster.request({
						resource: 'virtualpbx.billing.get_payments',
						data: {
							"account_id": self.accountId
						},
						success: function(data, status) {
							callback && callback(null, data.payments);
						},
						error: function(data, status) {
							callback && callback(null, data);
						}
					});
				}
			},
			function(err, results) {
				self.resellerInvoicesFormatData(results, globalCallback);
			}
		);
		},

		resellerInvoicesFormatData: function(data, globalCallback) {
			var self = this;
			
			if (data.payments === null) {
				data.payments == [];
			}

			globalCallback && globalCallback(data);
		}
	};

	return resellerInvoices;
});