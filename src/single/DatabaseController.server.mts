import { STORAGE_DB_FILE_PATH } from "@data/paths.mjs"
import { Sequelize, DataTypes, Transaction } from "sequelize"
import { User } from "@class/model/User.server.mjs"
import { Cuenta } from "@class/model/Cuenta.server.mjs"
import { Subcuenta } from "@class/model/Subcuenta.server.mjs"
import { Movimiento } from "@class/model/Movimiento.server.mjs"
import { Monto } from "@class/model/Monto.server.mjs"
import { Expense } from "@class/model/Expense.server.mjs"
import { TipoGasto } from "@data/enums/ExpenseType.mjs"
import { TipoMovimiento } from "@data/enums/MovimientoType.mjs"
import { TransactionsGroup } from "@class/model/TransactionGroup.server.mjs"

// crear base de datos
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: STORAGE_DB_FILE_PATH, // Ruta del archivo SQLite
    logging: (msg) => {
        // Solo loguea si el mensaje contiene "ERROR"
        if (msg.includes('ERROR')) {
            console.error(msg)
        }
    }
})

// crear tablas
Monto.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
     // metalico
    cincuenta: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    veinte: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    diez: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    cinco: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    dos: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    uno: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    cerocincuenta: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    ceroveinte: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    cerodiez: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    cerocinco: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    cerodos: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    cerouno: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
    // end metalico
}, {
    tableName: 'montos',
    sequelize: sequelize,
    timestamps: true
})

User.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    pendingMonto: {
        type: DataTypes.INTEGER.UNSIGNED,
        references: {
            model: Monto,
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: true
    },
    nullAccount: { // no se puede poner como foreign key de (cuenta) porque osino saltaría error (Cuenta todavía no existe en esta linea)
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true
    },
    username: {
        type: DataTypes.STRING(50)
    },
    password: {
        type: DataTypes.STRING(255)
    }
}, {
    tableName: 'users',
    sequelize: sequelize,
    timestamps: true
})

Cuenta.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(50),
        defaultValue: ''
    },
    percentage: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    isRemainder: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    ignore: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    owner: {
        type: DataTypes.INTEGER.UNSIGNED,
        references: {
            model: User,
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
}, {
    tableName: 'cuentas',
    sequelize: sequelize,
    timestamps: true
})

Subcuenta.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(50),
        defaultValue: ''
    },
    total: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    cashPending: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    cuenta: {
        type: DataTypes.INTEGER.UNSIGNED,
        references: {
            model: Cuenta,
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    monto: {
        type: DataTypes.INTEGER.UNSIGNED,
        references: {
            model: Monto,
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    maxMoney: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 20_000
    },
    isFilled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    tableName: 'subcuentas',
    sequelize: sequelize,
    timestamps: true
})

TransactionsGroup.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    uuid: {
        type: DataTypes.STRING(36),
        defaultValue: 'not assigned (probably a bug)',
        unique: true
    },
    transactionDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'transactiongroups',
    sequelize: sequelize,
    timestamps: true
})

Movimiento.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        transactionGroup: {
            type: DataTypes.INTEGER.UNSIGNED,
            references: {
                model: TransactionsGroup,
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            allowNull: false
        },
        fromCuenta: {
            type: DataTypes.INTEGER.UNSIGNED,
            references: {
                model: Cuenta,
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            allowNull: true
        },
        toCuenta: {
            type: DataTypes.INTEGER.UNSIGNED,
            references: {
                model: Cuenta,
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            allowNull: true
        },
        cantidad: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0
        },
        type: {
            type: DataTypes.ENUM(...Object.values(TipoMovimiento)),
            allowNull: false,
            defaultValue: TipoMovimiento.INGRESO
        },
        gastoName: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        tipoGasto: {
            type: DataTypes.ENUM(...Object.values(TipoGasto)),
            allowNull: true
        },
        // el concepto del movimiento:
        description: {
            type: DataTypes.STRING(500),
            allowNull: false,
            defaultValue: ''
        }
    }, {
    tableName: 'movimientos',
    sequelize: sequelize,
    timestamps: true
})

Expense.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(50),
        defaultValue: ''
    },
    owner: {
        type: DataTypes.INTEGER.UNSIGNED,
        references: {
            model: User,
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    type: {
        type: DataTypes.ENUM(...Object.values(TipoGasto)),
        allowNull: false,
        defaultValue: TipoGasto.MENSUAL
    }
}, {
    tableName: 'expenses',
    sequelize: sequelize,
    timestamps: true
})

// relaciones entre tablas
User.hasMany(Cuenta, { foreignKey: 'owner' })
Cuenta.belongsTo(User, { foreignKey: 'owner' })

User.hasOne(Cuenta, {foreignKey: 'nullAccount'})
Cuenta.belongsTo(User, { foreignKey: 'nullAccount'})

User.hasMany(Expense, { foreignKey: 'owner' })
Expense.belongsTo(User, { foreignKey: 'owner' })

User.hasOne(Monto, { foreignKey: 'pendingMonto' })
Monto.belongsTo(User, { foreignKey: 'pendingMonto' })

Cuenta.hasMany(Subcuenta, { foreignKey: 'cuenta' })
Subcuenta.belongsTo(Cuenta, { foreignKey: 'cuenta' })

Subcuenta.belongsTo(Monto, { foreignKey: 'monto' })
Monto.hasOne(Subcuenta, { foreignKey: 'monto' })

Cuenta.hasMany(Movimiento, { foreignKey: 'fromCuenta' })
Movimiento.belongsTo(Cuenta, { foreignKey: 'fromCuenta' })

Cuenta.hasMany(Movimiento, { foreignKey: 'toCuenta' })
Movimiento.belongsTo(Cuenta, { foreignKey: 'toCuenta' })

TransactionsGroup.hasMany(Movimiento, { foreignKey: 'transactionGroup' })
Movimiento.belongsTo(TransactionsGroup, { foreignKey: 'transactionGroup' })

Movimiento.hasOne(Monto, { foreignKey: 'monto' })
Monto.belongsTo(Movimiento, { foreignKey: 'monto' })

/**
 * Controlador de la base de datos
 */
export let DatabaseController = {
    sequelize: sequelize,

    /**
     * Sincroniza la base de datos (revisar las tablas y crearlas)
     * 
     * @returns true
     */
    sync: async () => {
        // await User.sync()
        // await Cuenta.sync()
        // await Subcuenta.sync()
        // await Movimiento.sync()
        // configuración para la sincronización HAY QUE TENER CUIDADO, posible delete from sin querer
        await sequelize.sync({
            alter: {
                // que altere las tablas sin borrar (por defecto borra la tabla)
                drop: false
            }
        })
    },

    /**
     * Inicia una transacción y devuelve un objeto de transacción para commitear o rollabckear
     */
    async startTransaction(): Promise<Transaction> {
        return await sequelize.transaction({ type: Transaction.TYPES.EXCLUSIVE })
    }
}