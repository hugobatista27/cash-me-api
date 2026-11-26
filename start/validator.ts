/*
|--------------------------------------------------------------------------
| Validator file
|--------------------------------------------------------------------------
|
| The validator file is used for configuring global transforms for VineJS.
| The transform below converts all VineJS date outputs from JavaScript
| Date objects to Luxon DateTime instances, so that validated dates are
| ready to use with Lucid models and other parts of the app that expect
| Luxon DateTime.
|
*/

import { DateTime } from 'luxon'
import vine, { SimpleMessagesProvider, VineDate } from '@vinejs/vine'

declare module '@vinejs/vine/types' {
  interface VineGlobalTransforms {
    date: DateTime
  }
}

VineDate.transform((value) => DateTime.fromJSDate(value))

vine.messagesProvider = new SimpleMessagesProvider(
  {
    'required': 'O campo {{ field }} é obrigatório.',
    'defined': 'O campo {{ field }} é obrigatório.',
    'string': 'O campo {{ field }} deve ser um texto válido.',
    'email': 'Informe um endereço de {{ field }} válido.',
    'minLength': 'O campo {{ field }} deve ter pelo menos {{ min }} caracteres.',
    'maxLength': 'O campo {{ field }} deve ter no máximo {{ max }} caracteres.',
    'fixedLength': 'O campo {{ field }} deve ter exatamente {{ size }} caracteres.',
    'sameAs': 'O campo {{ field }} deve ser igual ao campo de confirmação.',
    'confirmed': 'A confirmação de {{ field }} não confere.',
    'literal': 'Você deve aceitar {{ field }} para continuar.',
    'boolean': 'O campo {{ field }} deve ser verdadeiro ou falso.',
    'number': 'O campo {{ field }} deve ser numérico.',
    'min': 'O campo {{ field }} deve ser no mínimo {{ min }}.',
    'max': 'O campo {{ field }} deve ser no máximo {{ max }}.',
    'positive': 'O campo {{ field }} deve ser maior que zero.',
    'withoutDecimals': 'O campo {{ field }} deve ser um número inteiro.',
    'enum': 'O valor selecionado para {{ field }} é inválido.',
    'url': 'Informe uma URL válida para {{ field }}.',
    'regex': 'O formato do campo {{ field }} é inválido.',
    'database.unique': 'Este {{ field }} já está cadastrado no sistema.',
  },
  {
    'email': 'e-mail',
    'user.email': 'e-mail',
    'cpf': 'CPF',
    'phone': 'telefone',
    'password': 'senha',
    'user.password': 'senha',
    'passwordConfirmation': 'confirmação de senha',
    'user.passwordConfirmation': 'confirmação de senha',
    'fullName': 'nome completo',
    'user.fullName': 'nome do gestor',
    'termsAccepted': 'os Termos de Uso e Política de Privacidade',
    'cnpj': 'CNPJ',
    'establishment.cnpj': 'CNPJ',
    'legalName': 'razão social',
    'establishment.legalName': 'razão social',
    'tradeName': 'nome fantasia',
    'establishment.tradeName': 'nome fantasia',
    'address.postalCode': 'CEP',
    'address.state': 'UF',
    'address.city': 'cidade',
    'address.neighborhood': 'bairro',
    'address.street': 'logradouro',
    'address.number': 'número',
  }
)
