/* LAYOUT JS */

// Find current package and set card to active
var currentPackageTier = $('#id_current_package_tier').val();
var activePackageCard = $(`#tier_${currentPackageTier}_package`);
var activePackageCardLabel = $(`#tier_${currentPackageTier}_package > .current_package_label`);
var allPackageCardLabel = $(`.current_package_label`);
var formSubmitted = false;
activePackageCard.addClass('active');
activePackageCardLabel.text('Your current package');
activePackageCardLabel.removeClass('hidden');

$('.update-package-card').on('click', function () {
    $(this).find('span:first').removeClass('hidden');
    if (this != activePackageCard) {
        activePackageCard.addClass('hlf-trans');
        $(activePackageCard).find('.update-package-card-overlay').css('opacity', '0.75');
        $(activePackageCard).css('color', 'var(--dark-text)');
    }
});


/* STRIPE ELEMENTS */

// Logic below from Stripe documentation here: https://stripe.com/docs/payments/accept-a-payment

var stripePublicKey = $('#id_stripe_public_key').text().slice(1, -1);
var stripeClientSecret = $('#id_stripe_client_secret').text().slice(1, -1);
var is_upgrade = $('#is_upgrade').val();
var needs_dpm = $('#needs_dpm').val();
var stripe = Stripe(stripePublicKey);
var elements = stripe.elements();
var card = elements.create('card');
var csrftoken = Cookies.get('csrftoken');

if (is_upgrade === "False") {
    card.mount('#card_element');

    // Add errors to card handler

    card.addEventListener('change', function (event) {
        var errorDiv = $('#card_errors');
        if (event.error) {
            var html = `
        <span class="icon" role="alert">
            <i class="fas fa-times"></i>
        </span>
        <span>${event.error.message}</span>
        `;
            errorDiv.html(html);
        } else {
            errorDiv.text = "";
        }
    });

    // Handle form submit
    $('#submit_button').on('click', async (event) => {
        event.preventDefault();

        card.update({ 'disabled': true });
        $('.processing-spinner').css('display', 'flex').hide().fadeIn();
        $('#submit_button').attr('disabled', true);
        $('#submit_button').addClass('disabled');

        stripe.confirmCardPayment(stripeClientSecret, {
            payment_method: {
                card: card,
                billing_details: {
                    name: "bradley",
                }
            },
        }).then(function (result) {
            var errorDiv = $('#card_errors');
            if (result.error) {
                var html = `
            <span class="icon" role="alert">
            <i class="fas fa-times"></i>
            </span>
            <span>${result.error.message}</span>
            `;
                card.update({ 'disabled': false });
                errorDiv.html(html);
                $('.processing-spinner').fadeOut();
                $('#submit_button').attr('disabled', false);
                $('#submit_button').removeClass('disabled');
            } else {
                errorDiv.text = "";
                if (result.paymentIntent.status === 'succeeded') {
                    var formSubmitted = true;
                    $('#payment_form').submit();

                }
            }
        });
    });
}



// Update card details if none found

if (needs_dpm === "True") {
    card.mount('#card_element_update');

    card.addEventListener('change', function (event) {
        var errorDiv = $('#card_errors')
        if (event.error) {
            var html = `
        <span class="icon" role="alert">
        <i class="fas fa-times"></i>
        </span>
        <span>${event.error.message}</span>
        `;
            errorDiv.html(html);
        } else {
            errorDiv.text = "";
        }
    });

    // Handle form submit
    $('#submit_button').on('click', async (event) => {
        event.preventDefault();
    
        card.update({ 'disabled': true });
        $('.processing-spinner').css('display', 'flex').hide().fadeIn();
        $('#submit_button').attr('disabled', true);
        $('#submit_button').addClass('disabled');
        var billingFirstName = $('#first_name').val();
        var billingLastName = $('#last_name').val();
    
        stripe.createPaymentMethod({
            type: 'card',
            card: card,
            billing_details: {
                name: billingFirstName + billingLastName,
            },
        }).then(function (result) {
            var errorDiv = $('#card_errors')
            if (result.error) {
                var html = `
                <span class="icon" role="alert">
                <i class="fas fa-times"></i>
                </span>
                <span>${result.error.message}</span>
                `;
                card.update({ 'disabled': false });
                errorDiv.html(html);
                $('.processing-spinner').fadeOut();
                $('#submit_button').attr('disabled', false);
                $('#submit_button').removeClass('disabled');
            } else {
                errorDiv.text = "";
                if (result.paymentMethod) {
                    $('#payment_method_form').append(`
                <input type="hidden" name="payment_method" value="${result.paymentMethod.id}"></input>
                `).submit();
                
                }
            }
        });
    });
};


$(document).ready(() => {
    // If user abandons the page, destroy the subscription created
    $(window).on('unload', function () {
        if(formSubmitted == false){
        data = new FormData();
        data.append('csrfmiddlewaretoken', csrftoken);
        navigator.sendBeacon("../destroy_sub/", data);
    }
    });
});